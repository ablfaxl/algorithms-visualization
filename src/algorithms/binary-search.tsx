import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pause,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Search,
  Target,
} from "lucide-react";

interface ArrayElement {
  value: number;
  state:
    | "default"
    | "left_pointer"
    | "right_pointer"
    | "middle"
    | "found"
    | "eliminated"
    | "search_space";
  id: number;
}

interface SearchStep {
  array: ArrayElement[];
  leftIndex: number;
  rightIndex: number;
  middleIndex: number;
  target: number;
  message: string;
  phase: "start" | "comparing" | "found" | "not_found" | "go_left" | "go_right";
  comparison?: "equal" | "greater" | "less";
}

export default function BinarySearchVisualizer() {
  const [array, setArray] = useState<ArrayElement[]>([]);
  const [target, setTarget] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([500]);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SearchStep[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [searchResult, setSearchResult] = useState<
    "found" | "not_found" | null
  >(null);

  // Generate sorted array
  const generateSortedArray = useCallback(() => {
    const newArray: ArrayElement[] = [];
    const sortedValues = Array.from(
      { length: 12 },
      (_, i) => (i + 1) * 8 + Math.floor(Math.random() * 5)
    ).sort((a, b) => a - b); // Ensure array is sorted

    sortedValues.forEach((value, index) => {
      newArray.push({
        value,
        state: "default",
        id: index,
      });
    });

    setArray(newArray);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
    setIsPlaying(false);
    setSearchResult(null);

    // Set a random target from the array or a value not in array
    const shouldExist = Math.random() > 0.3;
    if (shouldExist) {
      setTarget(sortedValues[Math.floor(Math.random() * sortedValues.length)]);
    } else {
      setTarget(Math.floor(Math.random() * 100) + 1);
    }
  }, []);

  // Binary Search algorithm with step recording
  const binarySearch = useCallback(
    (arr: ArrayElement[], targetValue: number): SearchStep[] => {
      const steps: SearchStep[] = [];
      const arrayClone = arr.map(el => ({ ...el })); // Deep clone
      let left = 0;
      let right = arrayClone.length - 1;
      let stepCount = 1;

      // Initial step
      for (let i = 0; i < arrayClone.length; i++) {
        arrayClone[i].state = i >= left && i <= right ? "search_space" : "default";
      }
      arrayClone[left].state = "left_pointer";
      arrayClone[right].state = "right_pointer";

      steps.push({
        array: arrayClone.map(el => ({ ...el })),
        leftIndex: left,
        rightIndex: right,
        middleIndex: -1,
        target: targetValue,
        message: `شروع جستجو برای عدد ${targetValue} در آرایه مرتب شده`,
        phase: "start",
      });

      while (left <= right) {
        const middle = Math.floor((left + right) / 2);

        // Reset states
        for (let i = 0; i < arrayClone.length; i++) {
          if (i < left || i > right) {
            arrayClone[i].state = "eliminated";
          } else if (i === left) {
            arrayClone[i].state = "left_pointer";
          } else if (i === right) {
            arrayClone[i].state = "right_pointer";
          } else if (i === middle) {
            arrayClone[i].state = "middle";
          } else {
            arrayClone[i].state = "search_space";
          }
        }

        steps.push({
          array: arrayClone.map(el => ({ ...el })),
          leftIndex: left,
          rightIndex: right,
          middleIndex: middle,
          target: targetValue,
          message: `قدم ${stepCount}: انتخاب وسط - موقعیت ${middle} با مقدار ${arrayClone[middle].value}`,
          phase: "comparing",
        });

        if (arrayClone[middle].value === targetValue) {
          arrayClone[middle].state = "found";
          steps.push({
            array: arrayClone.map(el => ({ ...el })),
            leftIndex: left,
            rightIndex: right,
            middleIndex: middle,
            target: targetValue,
            message: `🎉 عدد ${targetValue} در موقعیت ${middle} پیدا شد!`,
            phase: "found",
            comparison: "equal",
          });
          return steps;
        } else if (arrayClone[middle].value > targetValue) {
          steps.push({
            array: arrayClone.map(el => ({ ...el })),
            leftIndex: left,
            rightIndex: right,
            middleIndex: middle,
            target: targetValue,
            message: `${arrayClone[middle].value} > ${targetValue} - جستجو در نیمه چپ`,
            phase: "go_left",
            comparison: "greater",
          });
          right = middle - 1;
        } else {
          steps.push({
            array: arrayClone.map(el => ({ ...el })),
            leftIndex: left,
            rightIndex: right,
            middleIndex: middle,
            target: targetValue,
            message: `${arrayClone[middle].value} < ${targetValue} - جستجو در نیمه راست`,
            phase: "go_right",
            comparison: "less",
          });
          left = middle + 1;
        }

        stepCount++;
      }

      // Not found
      for (let i = 0; i < arrayClone.length; i++) {
        arrayClone[i].state = "eliminated";
      }

      steps.push({
        array: arrayClone.map(el => ({ ...el })),
        leftIndex: left,
        rightIndex: right,
        middleIndex: -1,
        target: targetValue,
        message: `❌ عدد ${targetValue} در آرایه یافت نشد`,
        phase: "not_found",
      });

      return steps;
    },
    []
  );

  // Start searching
  const startSearch = useCallback(() => {
    if (steps.length === 0) {
      const searchSteps = binarySearch(array, target);
      setSteps(searchSteps);
    }
    setIsPlaying(true);
  }, [array, target, binarySearch, steps.length]);

  // Animation effect
  useEffect(() => {
    if (isPlaying && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setArray(steps[currentStep].array.map(el => ({ ...el }))); // Deep copy
        setCurrentStep((prev) => prev + 1);

        if (currentStep + 1 >= steps.length) {
          setIsPlaying(false);
          setIsCompleted(true);
          const lastStep = steps[steps.length - 1];
          setSearchResult(lastStep.phase === "found" ? "found" : "not_found");
        }
      }, Math.max(300, 1300 - speed[0])); // Minimum 300ms to avoid flickering

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, steps, speed]);

  // Initialize array on mount
  useEffect(() => {
    generateSortedArray();
  }, [generateSortedArray]);

  const pauseSearch = () => setIsPlaying(false);

  const resetSearch = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
    setSearchResult(null);
    generateSortedArray(); // Generate new sorted array
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setArray(steps[currentStep].array.map(el => ({ ...el })));
      setCurrentStep((prev) => prev + 1);
      if (currentStep + 1 >= steps.length) {
        setIsCompleted(true);
        const lastStep = steps[steps.length - 1];
        setSearchResult(lastStep.phase === "found" ? "found" : "not_found");
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setArray(steps[currentStep - 1].array.map(el => ({ ...el })));
      setIsCompleted(false);
      setSearchResult(null);
    }
  };

  const getBarColor = (state: ArrayElement["state"]) => {
    switch (state) {
      case "left_pointer":
        return "bg-blue-500 border-2 border-blue-700 transition-all duration-300";
      case "right_pointer":
        return "bg-purple-500 border-2 border-purple-700 transition-all duration-300";
      case "middle":
        return "bg-yellow-500 border-2 border-yellow-700 transition-all duration-300 scale-105";
      case "found":
        return "bg-green-500 border-2 border-green-700 transition-all duration-300 scale-110";
      case "eliminated":
        return "bg-red-300 opacity-50 transition-all duration-300";
      case "search_space":
        return "bg-cyan-400 transition-all duration-300";
      default:
        return "bg-gray-400 transition-all duration-300";
    }
  };

  const getPhaseColor = (phase: SearchStep["phase"]) => {
    switch (phase) {
      case "start":
        return "bg-blue-100 text-blue-800";
      case "comparing":
        return "bg-yellow-100 text-yellow-800";
      case "found":
        return "bg-green-100 text-green-800";
      case "not_found":
        return "bg-red-100 text-red-800";
      case "go_left":
        return "bg-purple-100 text-purple-800";
      case "go_right":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPhaseText = (phase: SearchStep["phase"]) => {
    switch (phase) {
      case "start":
        return "شروع جستجو";
      case "comparing":
        return "مقایسه";
      case "found":
        return "پیدا شد";
      case "not_found":
        return "یافت نشد";
      case "go_left":
        return "جستجو در چپ";
      case "go_right":
        return "جستجو در راست";
      default:
        return "جستجو";
    }
  };

  const currentMessage =
    steps[currentStep - 1]?.message || "آماده برای شروع جستجو";
  const currentPhase = steps[currentStep - 1]?.phase || "start";
  const currentStepData = steps[currentStep - 1];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-4"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              نمایش بصری الگوریتم جستجوی دودویی (Binary Search)
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Badge className={getPhaseColor(currentPhase)}>
                {getPhaseText(currentPhase)}
              </Badge>
              {currentStepData && (
                <>
                  <Badge variant="outline">
                    چپ: {currentStepData.leftIndex} | راست:{" "}
                    {currentStepData.rightIndex}
                  </Badge>
                  {currentStepData.middleIndex >= 0 && (
                    <Badge variant="outline">
                      وسط: {currentStepData.middleIndex}
                    </Badge>
                  )}
                </>
              )}
              <Badge variant="outline">
                قدم {currentStep} از {steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center items-center mb-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <label className="text-sm font-medium">عدد مورد جستجو:</label>
                <Input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-20 text-center"
                  disabled={isPlaying || steps.length > 0}
                />
              </div>

              <Button
                onClick={isPlaying ? pauseSearch : startSearch}
                disabled={isCompleted}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isPlaying ? "توقف" : "شروع جستجو"}
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
                onClick={resetSearch}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                بازنشانی
              </Button>

              <Button
                onClick={generateSortedArray}
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
              <div className="text-center text-sm text-gray-600 mt-1">
                {speed[0] < 300 ? "سریع" : speed[0] < 700 ? "متوسط" : "آهسته"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="flex items-end justify-center gap-1 h-72 mb-4">
                {array.map((element, index) => (
                  <div key={element.id} className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{index}</div>
                    <div
                      className={`transition-all duration-300 ease-in-out rounded-t-lg flex items-end justify-center text-white font-bold text-sm transform ${getBarColor(
                        element.state
                      )}`}
                      style={{
                        height: `${(element.value / 100) * 200}px`,
                        width: "50px",
                      }}
                    >
                      <span className="mb-2 drop-shadow-lg">
                        {element.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium text-gray-800">
                    {currentMessage}
                  </p>
                  {searchResult && (
                    <div className="mt-2">
                      {searchResult === "found" ? (
                        <Badge className="bg-green-100 text-green-800">
                          ✅ پیدا شد!
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          ❌ یافت نشد
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span>عادی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 border border-blue-700 rounded"></div>
                    <span>اشاره‌گر چپ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 border border-purple-700 rounded"></div>
                    <span>اشاره‌گر راست</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 border border-yellow-700 rounded"></div>
                    <span>عنصر وسط</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-400 rounded"></div>
                    <span>فضای جستجو</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 border border-green-700 rounded"></div>
                    <span>پیدا شده</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-300 opacity-50 rounded"></div>
                    <span>حذف شده</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    مراحل الگوریتم Binary Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-right space-y-4">
                  <div className="border-r-4 border-blue-500 pr-4">
                    <h4 className="font-bold text-blue-700">
                      ۱. تعیین محدوده جستجو
                    </h4>
                    <p className="text-sm text-gray-600">
                      اشاره‌گرهای چپ و راست ابتدا و انتهای آرایه را مشخص
                      می‌کنند.
                    </p>
                  </div>
                  <div className="border-r-4 border-yellow-500 pr-4">
                    <h4 className="font-bold text-yellow-700">
                      ۲. انتخاب عنصر وسط
                    </h4>
                    <p className="text-sm text-gray-600">
                      عنصر وسط محدوده فعلی انتخاب و با مقدار مورد جستجو مقایسه
                      می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-purple-500 pr-4">
                    <h4 className="font-bold text-purple-700">
                      ۳. مقایسه و تصمیم‌گیری
                    </h4>
                    <p className="text-sm text-gray-600">
                      بر اساس نتیجه مقایسه، نیمی از فضای جستجو حذف می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-green-500 pr-4">
                    <h4 className="font-bold text-green-700">
                      ۴. تکرار یا پایان
                    </h4>
                    <p className="text-sm text-gray-600">
                      فرآیند تا پیدا شدن عنصر یا تمام شدن فضای جستجو ادامه
                      می‌یابد.
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
                    <Badge variant="outline">O(log n)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">پیچیدگی مکانی:</span>
                    <Badge variant="outline">O(1)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">پیش‌نیاز:</span>
                    <Badge variant="outline">آرایه مرتب</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">نوع:</span>
                    <Badge variant="outline">تقسیم و حل</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">کاربرد:</span>
                    <Badge variant="outline">جستجوی سریع</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                    <p className="text-sm text-cyan-800">
                      <strong>نکته:</strong> Binary Search در هر قدم نیمی از
                      فضای جستجو را حذف می‌کند، به همین دلیل بسیار سریع است.
                    </p>
                  </div>
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>شرط:</strong> آرایه باید از قبل مرتب شده باشد تا
                      این الگوریتم کار کند.
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
