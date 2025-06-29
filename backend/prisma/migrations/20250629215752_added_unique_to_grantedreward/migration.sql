/*
  Warnings:

  - A unique constraint covering the columns `[userId,rewardId]` on the table `GrantedReward` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GrantedReward_userId_rewardId_key" ON "GrantedReward"("userId", "rewardId");
