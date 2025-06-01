"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Users } from "lucide-react"

interface Candidate {
  id: number
  name: string
  voteCount: number
}

interface ResultsDisplayProps {
  candidates: Candidate[]
  showDetailed?: boolean
}

export function ResultsDisplay({ candidates, showDetailed = false }: ResultsDisplayProps) {
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0)

  // Sort candidates by vote count (highest first)
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount)
  const winner = sortedCandidates[0]
  const isTie = sortedCandidates.length > 1 && sortedCandidates[0].voteCount === sortedCandidates[1].voteCount

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Live Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400 mb-4 text-center">Total Votes Cast: {totalVotes}</div>

          <div className="space-y-6">
            {sortedCandidates.map((candidate, index) => {
              const percentage = totalVotes > 0 ? Math.round((candidate.voteCount / totalVotes) * 100) : 0
              const isWinning = !isTie && index === 0 && totalVotes > 0

              return (
                <div key={candidate.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${candidate.id === 1 ? "text-green-400" : "text-purple-400"}`}>
                        {candidate.name}
                      </span>
                      {isWinning && <Trophy className="h-4 w-4 text-yellow-400" />}
                    </div>
                    <span className="text-blue-400 font-mono">{candidate.voteCount} votes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={percentage}
                      className={`h-3 bg-gray-700 ${
                        candidate.id === 1 ? "[&>div]:bg-green-500" : "[&>div]:bg-purple-500"
                      }`}
                    />
                    <span className="text-sm w-12 text-right font-mono">{percentage}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {showDetailed && totalVotes > 0 && (
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                Current Status
              </h3>
              <p className="text-sm text-gray-300">
                {isTie
                  ? "The election is currently tied. More votes needed to determine a winner."
                  : totalVotes === 0
                    ? "No votes have been cast yet."
                    : `${winner.name} is currently leading with ${winner.voteCount} votes (${Math.round((winner.voteCount / totalVotes) * 100)}%).`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
