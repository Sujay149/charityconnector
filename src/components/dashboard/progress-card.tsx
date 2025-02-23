// ProgressCard.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

type ProgressCardProps = {
  total: number;
  goal: number;
  onShare: () => void;
  onRewards: () => void;
};

export const ProgressCard: React.FC<ProgressCardProps> = ({
  total,
  goal,
  onShare,
  onRewards,
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg shadow-lg">
      <div>
        <h2 className="text-2xl font-bold text-white">Progress</h2>
        <p className="text-gray-400">${total} raised out of ${goal} goal</p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={onShare} variant="default" className="bg-yellow-500 hover:bg-yellow-600 shadow-lg transition-all">
          <Share2 className="mr-2" /> Open Link
        </Button>
        <Button onClick={onRewards} variant="default" className="bg-purple-500 hover:bg-purple-600 shadow-lg transition-all">
          Rewards
        </Button>
      </div>
    </div>
  );
};
