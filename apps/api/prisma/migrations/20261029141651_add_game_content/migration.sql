-- AlterTable
ALTER TABLE "Game_pc" ADD COLUMN     "ageRatings" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "criticRating" INTEGER,
ADD COLUMN     "criticRatingCount" INTEGER,
ADD COLUMN     "trailerYoutubeId" TEXT,
ADD COLUMN     "userRating" INTEGER,
ADD COLUMN     "userRatingCount" INTEGER;

-- CreateTable
CREATE TABLE "GameLanguage" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "audio" BOOLEAN NOT NULL,
    "subtitles" BOOLEAN NOT NULL,
    "interface" BOOLEAN NOT NULL,

    CONSTRAINT "GameLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameImage" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GameImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSection" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GameSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameLanguage_gameId_language_key" ON "GameLanguage"("gameId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "GameImage_gameId_position_key" ON "GameImage"("gameId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "GameSection_gameId_kind_key" ON "GameSection"("gameId", "kind");

-- AddForeignKey
ALTER TABLE "GameLanguage" ADD CONSTRAINT "GameLanguage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game_pc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameImage" ADD CONSTRAINT "GameImage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game_pc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSection" ADD CONSTRAINT "GameSection_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game_pc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
