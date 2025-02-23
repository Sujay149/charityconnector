import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Donation } from "@shared/schema";
import { motion } from "framer-motion";

export default function Transactions() {
  const { user } = useAuth();

  const { data: donations } = useQuery<Donation[]>({
    queryKey: [`/api/donations/${user?.referralCode}`],
  });

  if (!donations) return null;

  return (
    <motion.div
      className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <motion.div
          className="h-full p-8"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-8">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-lg">
                Transactions
              </h1>
              <p className="text-gray-400">
                View all donations made through your referral code
              </p>
            </motion.div>

            {/* Donation History Card */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gray-800/90 backdrop-blur-lg shadow-lg border border-gray-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg font-semibold">
                    Donation History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table className="text-white">
                    <TableHeader>
                      <TableRow className="border-b border-gray-700">
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Donor</TableHead>
                        <TableHead className="text-gray-300">Message</TableHead>
                        <TableHead className="text-gray-300 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-400">
                            No donations yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        donations.map((donation) => (
                          <motion.tr
                            key={donation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-gray-700/50 transition duration-300"
                          >
                            <TableCell className="text-gray-300">
                              {format(new Date(donation.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-gray-300">{donation.donorName}</TableCell>
                            <TableCell className="max-w-md truncate text-gray-400">
                              {donation.message || "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-400">
                              ${donation.amount.toLocaleString()}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
