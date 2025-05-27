import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Pause, RotateCcw, Search, Target } from "lucide-react";

interface Node {
  id: number;
  state: "default" | "visiting" | "visited" | "path" | "start" | "end";
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

interface GraphStep {
  nodes: Node[];
  edges: Edge[];
  currentNode: number | null;
  distances: { [key: number]: number };
  queue: { node: number; distance: number }[];
  message: string;
  phase: "start" | "visiting" | "visited" | "path" | "not_found";
}

export default function DijkstraVisualizer() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [startNode, setStartNode] = useState(0);
  const [endNode, setEndNode] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([500]);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GraphStep[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [searchResult, setSearchResult] = useState<"found" | "not_found" | null>(null);

  // Generate a simple weighted graph
  const generateGraph = useCallback(() => {
    const newNodes: Node[] = [
      { id: 0, state: "start", x: 100, y: 100 },
      { id: 1, state: "default", x: 200, y: 50 },
      { id: 2, state: "default", x: 200, y: 150 },
      { id: 3, state: "default", x: 300, y: 50 },
      { id: 4, state: "end", x: 300, y: 150 },
    ];
    const newEdges: Edge[] = [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 2, weight: 3 },
      { from: 1, to: 2, weight: 1 },
      { from: 1, to: 3, weight: 5 },
      { from: 2, to: 3, weight: 8 },
      { from: 3, to: 4, weight: 2 },
      { from: 2, to: 4, weight: 10 },
    ];

    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
    setIsPlaying(false);
    setSearchResult(null);
    setStartNode(0);
    setEndNode(4);
  }, []);

  // Dijkstra's algorithm with step recording
  const dijkstra = useCallback(
    (nodes: Node[], edges: Edge[], start: number, end: number): GraphStep[] => {
      const steps: GraphStep[] = [];
      const nodesClone = nodes.map((node) => ({ ...node }));
      const adjList: { [key: number]: { node: number; weight: number }[] } = {};

      // Build adjacency list
      nodesClone.forEach((node) => (adjList[node.id] = []));
      edges.forEach((edge) => {
        adjList[edge.from].push({ node: edge.to, weight: edge.weight });
        adjList[edge.to].push({ node: edge.from, weight: edge.weight }); // Undirected graph
      });

      const distances: { [key: number]: number } = {};
      const parent: { [key: number]: number | null } = {};
      const visited = new Set<number>();
      const priorityQueue: { node: number; distance: number }[] = [];

      // Initialize distances
      nodesClone.forEach((node) => {
        distances[node.id] = node.id === start ? 0 : Infinity;
        parent[node.id] = null;
      });

      priorityQueue.push({ node: start, distance: 0 });

      // Initial step
      nodesClone.forEach((node) => {
        node.state = node.id === start ? "start" : node.id === end ? "end" : "default";
      });
      steps.push({
        nodes: nodesClone.map((n) => ({ ...n })),
        edges,
        currentNode: start,
        distances: { ...distances },
        queue: [...priorityQueue],
        message: `شروع الگوریتم Dijkstra از گره ${start} برای یافتن کوتاه‌ترین مسیر به گره ${end}`,
        phase: "start",
      });

      while (priorityQueue.length > 0) {
        // Find node with minimum distance
        priorityQueue.sort((a, b) => a.distance - b.distance);
        const { node: current } = priorityQueue.shift()!;

        if (visited.has(current)) continue;
        visited.add(current);

        nodesClone[current].state = "visiting";
        steps.push({
          nodes: nodesClone.map((n) => ({ ...n })),
          edges,
          currentNode: current,
          distances: { ...distances },
          queue: [...priorityQueue],
          message: `در حال بررسی گره ${current} با فاصله ${distances[current]}`,
          phase: "visiting",
        });

        for (const { node: neighbor, weight } of adjList[current]) {
          if (!visited.has(neighbor)) {
            const newDistance = distances[current] + weight;
            if (newDistance < distances[neighbor]) {
              distances[neighbor] = newDistance;
              parent[neighbor] = current;
              priorityQueue.push({ node: neighbor, distance: newDistance });
              nodesClone[neighbor].state = "visited";
              steps.push({
                nodes: nodesClone.map((n) => ({ ...n })),
                edges,
                currentNode: current,
                distances: { ...distances },
                queue: [...priorityQueue],
                message: `به‌روزرسانی فاصله گره ${neighbor} به ${newDistance}`,
                phase: "visited",
              });
            }
          }
        }

        nodesClone[current].state = "visited";
        if (current === end) {
          // Reconstruct path
          const path: number[] = [];
          let currentNode: number | null = end;
          while (currentNode !== null) {
            path.unshift(currentNode);
            nodesClone[currentNode].state = "path";
            currentNode = parent[currentNode];
          }
          steps.push({
            nodes: nodesClone.map((n) => ({ ...n })),
            edges,
            currentNode: null,
            distances: { ...distances },
            queue: [...priorityQueue],
            message: `کوتاه‌ترین مسیر از ${start} به ${end} پیدا شد: ${path.join(" → ")} با فاصله ${distances[end]}`,
            phase: "path",
          });
          return steps;
        }
      }

      // Not found
      nodesClone.forEach((node) => {
        if (node.state !== "start" && node.state !== "end") {
          node.state = "default";
        }
      });
      steps.push({
        nodes: nodesClone.map((n) => ({ ...n })),
        edges,
        currentNode: null,
        distances: { ...distances },
        queue: [],
        message: `❌ مسیری به گره ${end} یافت نشد`,
        phase: "not_found",
      });

      return steps;
    },
    []
  );

  // Start Dijkstra
  const startDijkstra = useCallback(() => {
    if (steps.length === 0) {
      const dijkstraSteps = dijkstra(nodes, edges, startNode, endNode);
      setSteps(dijkstraSteps);
    }
    setIsPlaying(true);
  }, [nodes, edges, startNode, endNode, dijkstra, steps.length]);

  // Animation effect
  useEffect(() => {
    if (isPlaying && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setNodes(steps[currentStep].nodes.map((n) => ({ ...n })));
        setCurrentStep((prev) => prev + 1);

        if (currentStep + 1 >= steps.length) {
          setIsPlaying(false);
          setIsCompleted(true);
          const lastStep = steps[steps.length - 1];
          setSearchResult(lastStep.phase === "path" ? "found" : "not_found");
        }
      }, Math.max(300, 1300 - speed[0])); // Minimum 300ms to avoid flickering

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, steps, speed]);

  // Initialize graph on mount
  useEffect(() => {
    generateGraph();
  }, [generateGraph]);

  const pauseDijkstra = () => setIsPlaying(false);

  const resetDijkstra = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
    setIsCompleted(false);
    setSearchResult(null);
    generateGraph();
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setNodes(steps[currentStep].nodes.map((n) => ({ ...n })));
      setCurrentStep((prev) => prev + 1);
      if (currentStep + 1 >= steps.length) {
        setIsCompleted(true);
        const lastStep = steps[steps.length - 1];
        setSearchResult(lastStep.phase === "path" ? "found" : "not_found");
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setNodes(steps[currentStep - 1].nodes.map((n) => ({ ...n })));
      setIsCompleted(false);
      setSearchResult(null);
    }
  };

  const getNodeColor = (state: Node["state"]) => {
    switch (state) {
      case "start":
        return "bg-green-500 border-2 border-green-700 transition-all duration-300";
      case "end":
        return "bg-red-500 border-2 border-red-700 transition-all duration-300";
      case "visiting":
        return "bg-yellow-500 border-2 border-yellow-700 transition-all duration-300 scale-110";
      case "visited":
        return "bg-blue-400 transition-all duration-300";
      case "path":
        return "bg-purple-500 border-2 border-purple-700 transition-all duration-300 scale-110";
      default:
        return "bg-gray-400 transition-all duration-300";
    }
  };

  const getPhaseColor = (phase: GraphStep["phase"]) => {
    switch (phase) {
      case "start":
        return "bg-blue-100 text-blue-800";
      case "visiting":
        return "bg-yellow-100 text-yellow-800";
      case "visited":
        return "bg-blue-100 text-blue-800";
      case "path":
        return "bg-purple-100 text-purple-800";
      case "not_found":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPhaseText = (phase: GraphStep["phase"]) => {
    switch (phase) {
      case "start":
        return "شروع جستجو";
      case "visiting":
        return "در حال بررسی";
      case "visited":
        return "بازدید شده";
      case "path":
        return "مسیر پیدا شد";
      case "not_found":
        return "یافت نشد";
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
              نمایش بصری الگوریتم Dijkstra
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Badge className={getPhaseColor(currentPhase)}>
                {getPhaseText(currentPhase)}
              </Badge>
              {currentStepData && (
                <>
                  <Badge variant="outline">
                    گره فعلی: {currentStepData.currentNode ?? "-"}
                  </Badge>
                  <Badge variant="outline">
                    فاصله تا {endNode}:{" "}
                    {currentStepData.distances[endNode] === Infinity
                      ? "∞"
                      : currentStepData.distances[endNode]}
                  </Badge>
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
                <label className="text-sm font-medium">گره شروع:</label>
                <Input
                  type="number"
                  value={startNode}
                  onChange={(e) => setStartNode(Number(e.target.value))}
                  className="w-20 text-center"
                  disabled={isPlaying || steps.length > 0}
                  min={0}
                  max={nodes.length - 1}
                />
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <label className="text-sm font-medium">گره پایان:</label>
                <Input
                  type="number"
                  value={endNode}
                  onChange={(e) => setEndNode(Number(e.target.value))}
                  className="w-20 text-center"
                  disabled={isPlaying || steps.length > 0}
                  min={0}
                  max={nodes.length - 1}
                />
              </div>
              <Button
                onClick={isPlaying ? pauseDijkstra : startDijkstra}
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
                onClick={resetDijkstra}
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
            <div className="bg-white rounded-lg p-6 mb-4 relative">
              <svg className="w-full h-80" viewBox="0 0 400 300">
                {/* Render edges */}
                {edges.map((edge, index) => {
                  const fromNode = nodes.find((n) => n.id === edge.from)!;
                  const toNode = nodes.find((n) => n.id === edge.to)!;
                  const isPathEdge =
                    steps[currentStep - 1]?.phase === "path" &&
                    steps[currentStep - 1]?.nodes[edge.from].state === "path" &&
                    steps[currentStep - 1]?.nodes[edge.to].state === "path";
                  return (
                    <g key={`edge-${index}`}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        className={`stroke-2 transition-all duration-300 ${
                          isPathEdge ? "stroke-purple-500 stroke-4" : "stroke-gray-400"
                        }`}
                      />
                      <text
                        x={(fromNode.x + toNode.x) / 2}
                        y={(fromNode.y + toNode.y) / 2}
                        className="text-xs font-bold text-gray-800"
                        textAnchor="middle"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  );
                })}
                {/* Render nodes */}
                {nodes.map((node) => (
                  <g key={`node-${node.id}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      className={`fill-current ${getNodeColor(node.state)}`}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      className="text-white font-bold text-sm text-center"
                      textAnchor="middle"
                    >
                      {node.id}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium text-gray-800">
                    {currentMessage}
                  </p>
                  {searchResult && (
                    <div className="mt-2">
                      {searchResult === "found" ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          ✅ مسیر پیدا شد!
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          ❌ مسیر یافت نشد
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    <span>عادی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 border border-green-700 rounded-full"></div>
                    <span>گره شروع</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 border border-red-700 rounded-full"></div>
                    <span>گره پایان</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 border border-yellow-700 rounded-full"></div>
                    <span>در حال بررسی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                    <span>بازدید شده</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 border border-purple-700 rounded-full"></div>
                    <span>مسیر نهایی</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    مراحل الگوریتم Dijkstra
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-right space-y-4">
                  <div className="border-r-4 border-blue-500 pr-4">
                    <h4 className="font-bold text-blue-700">
                      ۱. مقداردهی اولیه
                    </h4>
                    <p className="text-sm text-gray-600">
                      فاصله گره شروع صفر و سایر گره‌ها بی‌نهایت تنظیم می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-yellow-500 pr-4">
                    <h4 className="font-bold text-yellow-700">
                      ۲. انتخاب گره
                    </h4>
                    <p className="text-sm text-gray-600">
                      گره با کمترین فاصله که هنوز بازدید نشده انتخاب می‌شود.
                    </p>
                  </div>
                  <div className="border-r-4 border-purple-500 pr-4">
                    <h4 className="font-bold text-purple-700">
                      ۳. به‌روزرسانی فاصله‌ها
                    </h4>
                    <p className="text-sm text-gray-600">
                      فاصله‌های همسایه‌ها به‌روزرسانی می‌شوند اگر مسیر جدید کوتاه‌تر باشد.
                    </p>
                  </div>
                  <div className="border-r-4 border-green-500 pr-4">
                    <h4 className="font-bold text-green-700">
                      ۴. یافتن مسیر یا پایان
                    </h4>
                    <p className="text-sm text-gray-600">
                      فرآیند تا یافتن گره پایان یا بازدید همه گره‌ها ادامه می‌یابد.
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
                    <Badge variant="outline">O((V + E) log V)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">پیچیدگی مکانی:</span>
                    <Badge variant="outline">O(V)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">نوع:</span>
                    <Badge variant="outline">جستجوی گراف</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">کاربرد:</span>
                    <Badge variant="outline">کوتاه‌ترین مسیر در گراف وزن‌دار</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                    <p className="text-sm text-cyan-800">
                      <strong>نکته:</strong> Dijkstra کوتاه‌ترین مسیر را در گراف‌های با وزن‌های غیرمنفی تضمین می‌کند.
                    </p>
                  </div>
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>شرط:</strong> وزن‌های یال‌ها باید غیرمنفی باشند.
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
