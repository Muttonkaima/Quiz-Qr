import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Clock, Target, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ResultsPage() {
  const { participantId } = useParams();

  const { data: participant, isLoading } = useQuery<{
    id: number;
    quizId: number;
    score: number;
    accuracy: number;
    averageResponseTime: number;
    rank: number;
  }>({
    queryKey: [`/api/participants/${participantId}`],
    enabled: !!participantId,
  });

  const { data: leaderboard = [] } = useQuery<Array<{
    id: number;
    name: string;
    email: string;
    score: number;
    accuracy: number;
    averageResponseTime: number;
    rank: number;
  }>>({
    queryKey: [`/api/quizzes/${participant?.quizId}/leaderboard`],
    enabled: !!participant?.quizId,
  });

  const { data: quiz } = useQuery<{
    id: number;
    title: string;
  }>({
    queryKey: [`/api/quizzes/${participant?.quizId}`],
    enabled: !!participant?.quizId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
            <p className="text-gray-600">Unable to load your quiz results.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-600 bg-yellow-50";
      case 2: return "text-gray-600 bg-gray-50";
      case 3: return "text-orange-600 bg-orange-50";
      default: return "text-purple-600 bg-purple-50";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "🏅";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <Card className="text-center mb-6 animate-in fade-in-50 duration-500">
          <CardHeader>
            <div className="bg-secondary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl mb-2">Quiz Complete!</CardTitle>
            <p className="text-gray-600 mb-6">Here are your results for "{quiz?.title}"</p>

            {/* Personal Results */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-700 flex items-center justify-center">
                  <Star className="mr-2 h-6 w-6" />
                  {participant.score}
                </div>
                <div className="text-sm text-gray-700 font-medium">Total Score</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-700 flex items-center justify-center">
                  <Target className="mr-2 h-6 w-6" />
                  {participant.accuracy}%
                </div>
                <div className="text-sm text-gray-700 font-medium">Accuracy</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-700 flex items-center justify-center">
                  <Clock className="mr-2 h-6 w-6" />
                  {participant.averageResponseTime}s
                </div>
                <div className="text-sm text-gray-700 font-medium">Avg Response</div>
              </div>
              <div className={`rounded-lg p-4 ${getRankColor(participant.rank)}`}>
                <div className="text-2xl font-bold flex items-center justify-center">
                  <span className="text-2xl mr-2">{getRankIcon(participant.rank)}</span>
                  {participant.rank}
                  {participant.rank === 1 ? "st" : participant.rank === 2 ? "nd" : participant.rank === 3 ? "rd" : "th"}
                </div>
                <div className="text-sm text-gray-600">Final Rank</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Top 3 Players */}
        <Card className="mb-6 animate-in fade-in-50 duration-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Medal className="text-yellow-600 mr-2" />
              Top 3 Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topThree.map((player: any, index: number) => (
                <div
                  key={player.id}
                  className={`flex items-center space-x-4 p-3 rounded-lg ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                      : "bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-400"
                  }`}>
                    <span className="text-lg">{getRankIcon(index + 1)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center">
                      {player.name}
                      {player.id === participant.id && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{player.accuracy}% accuracy</div>
                  </div>
                  <div className="text-lg font-bold text-primary">{player.score}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Full Leaderboard */}
        <Card className="animate-in fade-in-50 duration-1000">
          <CardHeader>
            <CardTitle>Full Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {leaderboard.map((player: any) => (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-100 transition-colors ${
                        player.id === participant.id ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                          player.rank === 1 ? "bg-yellow-500" : 
                          player.rank === 2 ? "bg-gray-400" : 
                          player.rank === 3 ? "bg-orange-400" : "bg-gray-300"
                        }`}>
                          {player.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 flex items-center">
                          {player.name}
                          {player.id === participant.id && (
                            <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{player.email}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-lg text-secondary">{player.score}</td>
                      <td className="py-3 px-4">
                        <Badge variant={player.accuracy >= 80 ? "default" : player.accuracy >= 60 ? "secondary" : "destructive"}>
                          {player.accuracy}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{player.averageResponseTime}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center mt-8">
          <Button
            onClick={() => window.location.href = "/"}
            className="bg-primary text-white hover:bg-blue-600"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
