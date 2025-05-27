import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  RotateCcw,
  Search,
} from "lucide-react";

interface Item {
  id: number;
  weight: number;
  value: number;
}

interface DPState {
  dpTable: number[][];
  currentRow: number;
  currentCol: number;
  message: string;
  phase: "start" | "filling" | "completed";
  selectedItem?: number;
  includedItems?: number[];
}

export default function KnapsackVisualizer() {
  const [items] = useState<Item[]>([
    { id: 0, weight: 2, value: 12 },
    { id: 1, weight: 1, value: 10 },
    { id: 2, weight: 3, value: 20 },
    { id: 3, weight: 2, value: 15 },
  ]);
  const [capacity, setCapacity] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([500]);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<DPState[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Generate Knapsack steps
  const generateKnapsackSteps = useCallback(() => {
    const steps: DPState[] = [];
    const n = items.length;
    const W = capacity;
    const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
    const keep = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

    // Initial step
    steps.push({
      dpTable: dp.map((row) => [...row]),
      currentRow: 0,
      currentCol: 0,
      message: `شروع الگوریتم کوله‌پشتی با ${n} شیء و ظرفیت ${W}`,
      phase: "start",
    });

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        if (items[i - 1].weight <= w) {
          const includeValue =
            items[i - 1].value + dp[i - 1][w - items[i - 1].weight];
          if (includeValue > dp[i - 1][w]) {
            dp[i][w] = includeValue;
            keep[i][w] = 1;
            steps.push({
              dpTable: dp.map((row) => [...row]),
              currentRow: i,
              currentCol: w,
              message: `شیء ${i - 1} (وزن: ${items[i - 1].weight}, ارزش: ${
                items[i - 1].value
              }) انتخاب شد. ارزش جدید: ${dp[i][w]}`,
              phase: "filling",
              selectedItem: i - 1,
            });
          } else {
            dp[i][w] = dp[i - 1][w];
            steps.push({
              dpTable: dp.map((row) => [...row]),
              currentRow: i,
              currentCol: w,
              message: `شیء ${i - 1} انتخاب نشد. ارزش بدون تغییر: ${dp[i][w]}`,
              phase: "filling",
              selectedItem: i - 1,
            });
          }
        } else {
          dp[i][w] = dp[i - 1][w];
          steps.push({
            dpTable: dp.map((row) => [...row]),
            currentRow: i,
            currentCol: w,
            message: `وزن شیء ${i - 1} (${
              items[i - 1].weight
            }) بیشتر از ظرفیت ${w} است. ارزش بدون تغییر: ${dp[i][w]}`,
            phase: "filling",
            selectedItem: i - 1,
          });
        }
      }
    }

    // Trace back included items
    const includedItems: number[] = [];
    let w = W;
    for (let i = n; i > 0 && w > 0; i--) {
      if (keep[i][w] === 1) {
        includedItems.push(i - 1);
        w -= items[i - 1].weight;
      }
    }

    steps.push({
      dpTable: dp.map((row) => [...row]),
      currentRow: n,
      currentCol: W,
      message: `الگوریتم کامل شد! ارزش بیشینه: ${dp[n][W]}. اشیاء انتخاب‌شده: ${
        includedItems.join(", ") || "هیچ"
      }`,
      phase: "completed",
      includedItems,
    });

    return steps;
  }, [items, capacity]);

  // Start visualization
  const startVisualization = useCallback(() => {
    if (steps.length === 0) {
      const knapsackSteps = generateKnapsackSteps();
      setSteps(knapsackSteps);
    }
    setIsPlaying(true);
  }, [steps.length, generateKnapsackSteps]);

  // Animation effect
  useEffect(() => {
    if (isPlaying && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        if (currentStep + 1 >= steps.length) {
          setIsPlaying(false);
          setIsCompleted(true);
        }
      }, Math.max(300, 1300 - speed[0])); // Minimum 300ms to avoid flickering

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, steps, speed]);

  // Initialize on mount
  useEffect(() => {
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setIsCompleted(false);
  }, [items, capacity]);

  const pauseVisualization = () => setIsPlaying(false);

  const resetVisualization = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
      if (currentStep + 1 >= steps.length) {
        setIsCompleted(true);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setIsCompleted(false);
    }
  };

  const getCellColor = (
    row: number,
    col: number,
    currentRow: number,
    currentCol: number
  ) => {
    if (row === currentRow && col === currentCol) {
      return "bg-yellow-500 text-white transition-all duration-300";
    }
    if (row <= currentRow && col <= currentCol) {
      return "bg-blue-400 text-white transition-all duration-300";
    }
    return "bg-gray-200 text-gray-800";
  };

  const getItemColor = (
    itemId: number,
    selectedItem?: number,
    includedItems?: number[]
  ) => {
    if (includedItems && includedItems.includes(itemId)) {
      return "bg-green-500 text-white transition-all duration-300";
    }
    if (itemId === selectedItem) {
      return "bg-yellow-500 text-white transition-all duration-300";
    }
    return "bg-gray-300 text-gray-800";
  };

  const currentMessage =
    steps[currentStep - 1]?.message || "آماده برای شروع الگوریتم کوله‌پشتی";
  const currentPhase = steps[currentStep - 1]?.phase || "start";
  const currentTable =
    steps[currentStep - 1]?.dpTable ||
    Array(items.length + 1)
      .fill(0)
      .map(() => Array(capacity + 1).fill(0));

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-4"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              نمایش بصری الگوریتم کوله‌پشتی (0/1 Knapsack)
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Badge
                className={
                  currentPhase === "start"
                    ? "bg-blue-100 text-blue-800"
                    : currentPhase === "filling"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {currentPhase === "start"
                  ? "شروع"
                  : currentPhase === "filling"
                  ? "در حال پر کردن"
                  : "کامل شده"}
              </Badge>
              <Badge variant="outline">
                قدم {currentStep} از {steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ظرفیت کوله‌پشتی:</label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-20 text-center"
                  disabled={isPlaying || steps.length > 0}
                  min={1}
                />
              </div>
              <Button
                onClick={isPlaying ? pauseVisualization : startVisualization}
                disabled={isCompleted}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isPlaying ? "توقف" : "شروع"}
              </Button>
              <Button
                onClick={prevStep}
                disabled={currentStep === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                قدم قبل
              </Button>
              <Button
                onClick={nextStep}
                disabled={currentStep >= steps.length}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                قدم بعد
              </Button>
              <Button
                onClick={resetVisualization}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                بازنشانی
              </Button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                سرعت انیمیشن
              </label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                max={1000}
                min={100}
                step={50}
                className="w-64 mx-auto"
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {speed[0] < 300 ? "سریع" : speed[0] < 700 ? "متوسط" : "آهسته"}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 mb-4">
              {/* Items Table */}
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">اشیاء</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="font-medium">شناسه</div>
                  <div className="font-medium">وزن</div>
                  <div className="font-medium">ارزش</div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded ${getItemColor(
                        item.id,
                        steps[currentStep - 1]?.selectedItem,
                        steps[currentStep - 1]?.includedItems
                      )}`}
                    >
                      {item.id}
                    </div>
                  ))}
                  {items.map((item) => (
                    <div
                      key={`weight-${item.id}`}
                      className={`p-2 rounded ${getItemColor(
                        item.id,
                        steps[currentStep - 1]?.selectedItem,
                        steps[currentStep - 1]?.includedItems
                      )}`}
                    >
                      {item.weight}
                    </div>
                  ))}
                  {items.map((item) => (
                    <div
                      key={`value-${item.id}`}
                      className={`p-2 rounded ${getItemColor(
                        item.id,
                        steps[currentStep - 1]?.selectedItem,
                        steps[currentStep - 1]?.includedItems
                      )}`}
                    >
                      {item.value}
                    </div>
                  ))}
                </div>
              </div>
              {/* DP Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-300">i \ w</th>
                      {Array.from({ length: capacity + 1 }, (_, i) => (
                        <th key={i} className="border p-2 bg-gray-300">
                          {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTable.map((row, i) => (
                      <tr key={i}>
                        <td className="border p-2 bg-gray-300">{i}</td>
                        {row.map((value, j) => (
                          <td
                            key={j}
                            className={`border p-2 ${getCellColor(
                              i,
                              j,
                              steps[currentStep - 1]?.currentRow || 0,
                              steps[currentStep - 1]?.currentCol || 0
                            )}`}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-4">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium text-gray-800">
                    {currentMessage}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span>پر نشده</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span>پر شده</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>در حال پر شدن</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>شیء انتخاب‌شده</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    مراحل الگوریتم کوله‌پشتی
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-right space-y-4">
                  <div className="border-r-4 border-blue-500 pr-4">
                    <h4 className="font-bold text-blue-700">
                      ۱. مقداردهی اولیه
                    </h4>
                    <p className="text-sm text-gray-600">
                      جدول DP با صفر مقداردهی می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-yellow-500 pr-4">
                    <h4 className="font-bold text-yellow-700">
                      ۲. بررسی اشیاء
                    </h4>
                    <p className="text-sm text-gray-600">
                      برای هر شیء و ظرفیت، تصمیم گرفته می‌شود که آیا شیء انتخاب
                      شود یا خیر.
                    </p>
                  </div>
                  <div className="border-r-4 border-green-500 pr-4">
                    <h4 className="font-bold text-green-700">
                      ۳. به‌روزرسانی جدول
                    </h4>
                    <p className="text-sm text-gray-600">
                      ارزش بیشینه برای هر حالت محاسبه و در جدول ذخیره می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-purple-500 pr-4">
                    <h4 className="font-bold text-purple-700">
                      ۴. یافتن نتیجه
                    </h4>
                    <p className="text-sm text-gray-600">
                      اشیاء انتخاب‌شده با ردیابی جدول مشخص می‌شوند.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">ویژگی‌های الگوریتم</CardTitle>
                </CardHeader>
                <CardContent className="text-right space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">پیچیدگی زمانی:</span>
                    <Badge variant="outline">O(n * W)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">پیچیدگی مکانی:</span>
                    <Badge variant="outline">O(n * W)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">نوع:</span>
                    <Badge variant="outline">برنامه‌نویسی پویا</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">کاربرد:</span>
                    <Badge variant="outline">بهینه‌سازی انتخاب</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                    <p className="text-sm text-cyan-800">
                      <strong>نکته:</strong> الگوریتم کوله‌پشتی ارزش بیشینه را
                      با توجه به محدودیت وزن تضمین می‌کند.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
