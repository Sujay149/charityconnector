import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { Donation } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRewards, setShowRewards] = useState(false);

  const { data } = useQuery<{ total: number; user: { goalAmount: number } }>({
    queryKey: [`/api/fundraiser/${user?.referralCode}`],
  });

  const { data: donations } = useQuery<Donation[]>({
    queryKey: [`/api/donations/${user?.referralCode}`],
  });

  const donationLink = `${window.location.origin}/d/${user?.referralCode}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(donationLink);
    toast({ description: "Link is now copied to the clipboard!" });
  };

  const handleShareOnWhatsApp = async () => {
    const message = `Join my fundraising campaign! ${donationLink}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, "_blank");
  };

  const handleRewardsClick = () => {
    setShowRewards(!showRewards);
  };

  if (!user || !data || !donations) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="flex h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <Sidebar>
        <ul className="space-y-4">
          <li><a href="/dashboard" className="text-white hover:text-gray-300">Dashboard</a></li>
          <li><a href="/transactions" className="text-white hover:text-gray-300">Transactions</a></li>
        </ul>
      </Sidebar>
      <div className="flex-1 overflow-auto">
        <div className="h-full p-8">
          <motion.div className="space-y-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }}>
            <div className="flex justify-between items-center">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">Welcome, {user.fullName}</h1>
                <p className="text-gray-400">Here's how your fundraising campaign is doing</p>
              </motion.div>
              <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600 shadow-lg transition-all">Start Here</Button>
            </div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <ProgressCard total={data.total} goal={data.user.goalAmount} onShare={handleCopyLink} onRewards={handleRewardsClick} />
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <StatsCard donations={donations.length} total={data.total} />
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card className="bg-gray-800 shadow-xl rounded-lg">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Donation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="p-2 text-left text-gray-400">Date</th>
                        <th className="p-2 text-left text-gray-400">Donor</th>
                        <th className="p-2 text-left text-gray-400">Message</th>
                        <th className="p-2 text-right text-gray-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-gray-400 py-4">No donations yet</td>
                        </tr>
                      ) : (
                        donations.map((donation) => (
                          <motion.tr key={donation.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="border-b border-gray-700 hover:bg-gray-800">
                            <td className="p-2">{new Date(donation.createdAt).toLocaleDateString()}</td>
                            <td className="p-2">{donation.donorName}</td>
                            <td className="p-2 truncate max-w-xs">{donation.message || "-"}</td>
                            <td className="p-2 text-right font-bold text-green-400">${donation.amount.toLocaleString()}</td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Goal Achieved</h2>
                <Button onClick={handleCopyLink} className="bg-blue-500 hover:bg-blue-600 text-white">Copy Donation Link</Button>
              </div>
              <p className="text-gray-400">Amount of donations made through your referral code: ₹{data.total.toLocaleString()}</p>
              <Button onClick={handleShareOnWhatsApp} className="bg-green-500 hover:bg-green-600 text-white">Share on WhatsApp</Button>
              <p className="text-gray-400">Referral Code: {user.referralCode}</p>
            </div>

            {showRewards && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <Card className="bg-gray-800 shadow-xl rounded-lg mt-4">
                  <CardHeader>
                    <CardTitle className="text-purple-400">Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Here are the rewards you have earned:</p>
                    <ul>
                      <li>Badge: Star Fundraiser</li>
                      <li>Discount: 10% off on next campaign</li>
                      <li>Free Swag: T-shirt and Stickers</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
