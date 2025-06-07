import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface LeaderboardProps {
  quizId: number;
}

export default function Leaderboard({ quizId }: LeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/leaderboard`],
    enabled: !!quizId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No participants yet</p>
      </div>
    );
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500";
      case 2: return "bg-gray-400";
      case 3: return "bg-orange-400";
      default: return "bg-gray-300";
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "default";
    if (accuracy >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Accuracy</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Avg Time</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((participant: any) => (
            <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${getRankColor(participant.rank)}`}>
                  {participant.rank}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{participant.name}</div>
                <div className="text-sm text-gray-500">{participant.email}</div>
              </td>
              <td className="py-3 px-4 font-semibold text-lg text-secondary">
                {participant.score}
              </td>
              <td className="py-3 px-4">
                <Badge variant={getAccuracyColor(participant.accuracy)}>
                  {participant.accuracy}%
                </Badge>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {participant.averageResponseTime}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
