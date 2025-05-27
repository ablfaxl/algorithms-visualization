import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ArrayElement {
  value: number;
  state:
    | "default"
    | "pivot"
    | "comparing"
    | "smaller"
    | "greater"
    | "swapping"
    | "sorted"
    | "current_partition";
  id: number;
}

interface SortStep {
  array: ArrayElement[];
  pivotIndex?: number;
  leftIndex?: number;
  rightIndex?: number;
  message: string;
  phase:
    | "choosing_pivot"
    | "partitioning"
    | "recursive_call"
    | "base_case"
    | "completed";
  currentRange?: { start: number; end: number };
  recursionLevel?: number;
}

export default function QuickSortVisualizer() {
  const [array, setArray] = useState<ArrayElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([400]);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize random array
  const generateRandomArray = useCallback(() => {
    const newArray: ArrayElement[] = [];
    for (let i = 0; i < 10; i++) {
      newArray.push({
        value: Math.floor(Math.random() * 90) + 10,
        state: "default",
        id: i,
      });
    }
    setArray(newArray);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
    setIsPlaying(false);
  }, []);

  // Enhanced QuickSort algorithm with detailed step recording
  const quickSort = useCallback((arr: ArrayElement[]): SortStep[] => {
    const steps: SortStep[] = [];
    const arrayClone = arr.map((el) => ({ ...el }));
    let recursionLevel = 0;

    function addStep(
      message: string,
      phase: SortStep["phase"],
      pivotIndex?: number,
      leftIndex?: number,
      rightIndex?: number,
      currentRange?: { start: number; end: number }
    ) {
      steps.push({
        array: arrayClone.map((el) => ({ ...el })), // Deep clone
        pivotIndex,
        leftIndex,
        rightIndex,
        message,
        phase,
        currentRange,
        recursionLevel,
      });
    }

    function partition(low: number, high: number): number {
      for (let i = low; i <= high; i++) {
        arrayClone[i].state = "current_partition";
      }
      addStep(
        `تقسیم‌بندی آرایه از موقعیت ${low} تا ${high}`,
        "partitioning",
        undefined,
        undefined,
        undefined,
        { start: low, end: high }
      );

      const pivot = arrayClone[high];
      arrayClone[high].state = "pivot";
      addStep(
        `انتخاب محور: عنصر ${pivot.value} در موقعیت ${high}`,
        "choosing_pivot",
        high,
        undefined,
        undefined,
        { start: low, end: high }
      );

      let i = low - 1;

      for (let j = low; j < high; j++) {
        for (let k = low; k <= high; k++) {
          if (k === high) arrayClone[k].state = "pivot";
          else if (k === j) arrayClone[k].state = "comparing";
          else if (k <= i) arrayClone[k].state = "smaller";
          else arrayClone[k].state = "greater";
        }

        addStep(
          `مقایسه ${arrayClone[j].value} با محور ${pivot.value}`,
          "partitioning",
          high,
          j,
          i + 1,
          { start: low, end: high }
        );

        if (arrayClone[j].value < pivot.value) {
          i++;
          arrayClone[i].state = "swapping";
          arrayClone[j].state = "swapping";
          addStep(
            `${arrayClone[j].value} کمتر از محور است - تعویض با موقعیت ${i}`,
            "partitioning",
            high,
            j,
            i,
            { start: low, end: high }
          );

          [arrayClone[i], arrayClone[j]] = [arrayClone[j], arrayClone[i]];

          for (let k = low; k <= high; k++) {
            if (k === high) arrayClone[k].state = "pivot";
            else if (k <= i) arrayClone[k].state = "smaller";
            else arrayClone[k].state = "greater";
          }
          addStep(
            `تعویض انجام شد - عناصر کوچکتر در سمت چپ`,
            "partitioning",
            high,
            undefined,
            undefined,
            { start: low, end: high }
          );
        }
      }

      arrayClone[i + 1].state = "swapping";
      arrayClone[high].state = "swapping";
      addStep(
        `قرار دادن محور در موقعیت صحیح`,
        "partitioning",
        high,
        i + 1,
        high,
        { start: low, end: high }
      );
      [arrayClone[i + 1], arrayClone[high]] = [
        arrayClone[high],
        arrayClone[i + 1],
      ];

      arrayClone[i + 1].state = "sorted";
      addStep(
        `محور ${arrayClone[i + 1].value} در موقعیت نهایی قرار گرفت`,
        "partitioning",
        i + 1,
        undefined,
        undefined,
        { start: low, end: high }
      );

      return i + 1;
    }

    function quickSortHelper(low: number, high: number) {
      recursionLevel++;

      if (low < high) {
        addStep(
          `فراخوانی بازگشتی برای بازه [${low}, ${high}] - سطح ${recursionLevel}`,
          "recursive_call",
          undefined,
          undefined,
          undefined,
          { start: low, end: high }
        );

        const pi = partition(low, high);

        addStep(
          `تقسیم‌بندی کامل شد - حالا دو زیرآرایه داریم`,
          "recursive_call",
          pi,
          undefined,
          undefined,
          { start: low, end: high }
        );

        if (low < pi - 1) {
          addStep(
            `مرتب‌سازی زیرآرایه چپ [${low}, ${pi - 1}]`,
            "recursive_call",
            pi,
            undefined,
            undefined,
            { start: low, end: pi - 1 }
          );
          quickSortHelper(low, pi - 1);
        } else if (low === pi - 1) {
          arrayClone[low].state = "sorted";
          addStep(
            `حالت پایه: تنها یک عنصر در زیرآرایه چپ`,
            "base_case",
            undefined,
            undefined,
            undefined,
            { start: low, end: low }
          );
        }

        if (pi + 1 < high) {
          addStep(
            `مرتب‌سازی زیرآرایه راست [${pi + 1}, ${high}]`,
            "recursive_call",
            pi,
            undefined,
            undefined,
            { start: pi + 1, end: high }
          );
          quickSortHelper(pi + 1, high);
        } else if (pi + 1 === high) {
          arrayClone[high].state = "sorted";
          addStep(
            `حالت پایه: تنها یک عنصر در زیرآرایه راست`,
            "base_case",
            undefined,
            undefined,
            undefined,
            { start: high, end: high }
          );
        }
      } else if (low === high) {
        arrayClone[low].state = "sorted";
        addStep(
          `حالت پایه: تنها یک عنصر باقی مانده`,
          "base_case",
          undefined,
          undefined,
          undefined,
          { start: low, end: high }
        );
      }

      recursionLevel--;
    }

    addStep(
      "آرایه اولیه آماده است",
      "recursive_call",
      undefined,
      undefined,
      undefined,
      {
        start: 0,
        end: arrayClone.length - 1,
      }
    );

    quickSortHelper(0, arrayClone.length - 1);

    for (let i = 0; i < arrayClone.length; i++) {
      arrayClone[i].state = "sorted";
    }
    addStep("مرتب‌سازی کامل شد! 🎉", "completed");

    return steps;
  }, []);

  // Start sorting
  const startSorting = useCallback(() => {
    if (steps.length === 0) {
      const sortSteps = quickSort(array);
      setSteps(sortSteps);
    }
    setIsPlaying(true);
  }, [array, quickSort, steps.length]);

  // Animation effect
  useEffect(() => {
    if (isPlaying && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setArray(steps[currentStep].array);
        setCurrentStep((prev) => prev + 1);

        if (currentStep + 1 === steps.length) {
          setIsPlaying(false);
          setIsCompleted(true);
        }
      }, 1200 - speed[0]);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, steps, speed]);

  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  const pauseSorting = () => setIsPlaying(false);
  const resetSorting = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
    generateRandomArray();
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setArray(steps[currentStep].array);
      setCurrentStep((prev) => prev + 1);
      if (currentStep + 1 >= steps.length) {
        setIsCompleted(true);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setArray(steps[currentStep - 1].array);
      setIsCompleted(false);
    }
  };

  const getBarColor = (state: ArrayElement["state"]) => {
    switch (state) {
      case "pivot":
        return "bg-red-500 border-2 border-red-700 animate-pulse";
      case "comparing":
        return "bg-yellow-500 border-2 border-yellow-700 animate-bounce";
      case "smaller":
        return "bg-blue-400 animate-pulse";
      case "greater":
        return "bg-purple-400 animate-pulse";
      case "swapping":
        return "bg-orange-500 border-2 border-orange-700 animate-ping";
      case "sorted":
        return "bg-green-500 animate-pulse";
      case "current_partition":
        return "bg-gray-300 border-2 border-gray-500 animate-pulse";
      default:
        return "bg-gray-400";
    }
  };

  const getPhaseColor = (phase: SortStep["phase"]) => {
    switch (phase) {
      case "choosing_pivot":
        return "bg-red-100 text-red-800";
      case "partitioning":
        return "bg-blue-100 text-blue-800";
      case "recursive_call":
        return "bg-purple-100 text-purple-800";
      case "base_case":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPhaseText = (phase: SortStep["phase"]) => {
    switch (phase) {
      case "choosing_pivot":
        return "انتخاب محور";
      case "partitioning":
        return "تقسیم‌بندی";
      case "recursive_call":
        return "فراخوانی بازگشتی";
      case "base_case":
        return "حالت پایه";
      case "completed":
        return "تکمیل شده";
      default:
        return "شروع";
    }
  };

  const currentMessage = steps[currentStep - 1]?.message || "آماده برای شروع";
  const currentPhase = steps[currentStep - 1]?.phase || "recursive_call";
  const currentRange = steps[currentStep - 1]?.currentRange;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              نمایش بصری الگوریتم مرتب‌سازی سریع (QuickSort)
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Badge className={getPhaseColor(currentPhase)}>
                {getPhaseText(currentPhase)}
              </Badge>
              {currentRange && (
                <Badge variant="outline">
                  بازه فعلی: [{currentRange.start}, {currentRange.end}]
                </Badge>
              )}
              <Badge variant="outline">
                قدم {currentStep} از {steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
              <Button
                onClick={isPlaying ? pauseSorting : startSorting}
                disabled={isCompleted}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
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
                onClick={resetSorting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                بازنشانی
              </Button>

              <Button
                onClick={generateRandomArray}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                آرایه جدید
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
              <div dir="rtl" className="text-center text-sm text-gray-600 mt-1">
                {speed[0] < 300 ? "سریع" : speed[0] < 700 ? "متوسط" : "آهسته"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="flex items-end justify-center gap-1 h-72 mb-4">
                {array.map((element) => (
                  <div
                    key={element.id}
                    className={`transition-all duration-500 ease-in-out rounded-t-lg flex items-end justify-center text-white font-bold text-sm transform hover:scale-105 ${getBarColor(
                      element.state
                    )}`}
                    style={{
                      height: `${(element.value / 100) * 240}px`,
                      width: "45px",
                    }}
                  >
                    <span className="mb-2 drop-shadow-lg">{element.value}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium text-gray-800">
                    {currentMessage}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span>عادی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 border border-red-700 rounded"></div>
                    <span>محور</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 border border-yellow-700 rounded"></div>
                    <span>در حال مقایسه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span>کوچکتر از محور</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-400 rounded"></div>
                    <span>بزرگتر از محور</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 border border-orange-700 rounded"></div>
                    <span>در حال تعویض</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>مرتب شده</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 border border-gray-500 rounded"></div>
                    <span>بخش فعلی</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    مراحل الگوریتم QuickSort
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-right space-y-4">
                  <div className="border-r-4 border-red-500 pr-4">
                    <h4 className="font-bold text-red-700">
                      ۱. انتخاب محور (Choose Pivot)
                    </h4>
                    <p className="text-sm text-gray-600">
                      یک عنصر از آرایه به عنوان محور انتخاب می‌شود. معمولاً
                      آخرین عنصر انتخاب می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-blue-500 pr-4">
                    <h4 className="font-bold text-blue-700">
                      ۲. تقسیم‌بندی (Partition)
                    </h4>
                    <p className="text-sm text-gray-600">
                      آرایه طوری مرتب می‌شود که عناصر کوچکتر از محور در سمت چپ و
                      بزرگتر در سمت راست قرار گیرند.
                    </p>
                  </div>
                  <div className="border-r-4 border-purple-500 pr-4">
                    <h4 className="font-bold text-purple-700">
                      ۳. فراخوانی بازگشتی (Recursive Call)
                    </h4>
                    <p className="text-sm text-gray-600">
                      همین فرآیند برای دو زیرآرایه چپ و راست تکرار می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-green-500 pr-4">
                    <h4 className="font-bold text-green-700">
                      ۴. حالت پایه (Base Case)
                    </h4>
                    <p className="text-sm text-gray-600">
                      وقتی تنها یک عنصر باقی می‌ماند، بازگشت متوقف می‌شود.
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
                    <span className="font-medium">پیچیدگی زمانی متوسط:</span>
                    <Badge variant="outline">O(n log n)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      پیچیدگی زمانی بدترین حالت:
                    </span>
                    <Badge variant="outline">O(n²)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">پیچیدگی مکانی:</span>
                    <Badge variant="outline">O(log n)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">نوع:</span>
                    <Badge variant="outline">درجا (In-place)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">پایداری:</span>
                    <Badge variant="outline">ناپایدار</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>نکته:</strong> QuickSort یکی از سریع‌ترین
                      الگوریتم‌های مرتب‌سازی است و در عمل بسیار کارآمد عمل
                      می‌کند.
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
