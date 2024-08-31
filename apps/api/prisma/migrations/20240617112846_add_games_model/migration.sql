-- CreateTable
CREATE TABLE "Game_pc" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "game_url" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "release_date" TEXT NOT NULL,
    "freetogame_profile_url" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,

    CONSTRAINT "Game_pc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_pc_title_key" ON "Game_pc"("title");
