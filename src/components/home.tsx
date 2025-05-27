import { Link } from "react-router-dom";

export interface IAlgorithm {
  name: string;
  path: string;
}
export const algorithms = [
  { name: "Quick Sort", path: "/quick-sort" },
  { name: "Binary Search", path: "/binary-search" },
  { name: "Bubble Sort", path: "/bubble-sort" },
  { name: "Insertion Sort", path: "/insertion-sort" },
  { name: "Selection Sort", path: "/selection-sort" },
  { name: "Heap Sort", path: "/heap-sort" },
  { name: "Radix Sort", path: "/radix-sort" },
  { name: "Counting Sort", path: "/counting-sort" },
];
export default function Home() {
  // list of content algorithms

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Algorithm Visualizer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {algorithms.map((algorithm: IAlgorithm) => (
          <Link
            key={algorithm.name}
            to={algorithm.path}
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
          >
            <h2 className="text-xl font-semibold">{algorithm.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
