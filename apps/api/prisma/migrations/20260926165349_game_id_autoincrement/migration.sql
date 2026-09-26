-- AlterTable
CREATE SEQUENCE game_pc_id_seq;
ALTER TABLE "Game_pc" ALTER COLUMN "id" SET DEFAULT nextval('game_pc_id_seq');
ALTER SEQUENCE game_pc_id_seq OWNED BY "Game_pc"."id";

-- Existing ids came from the FreeToGame import. Start the sequence after the
-- highest one, so new games never collide with them.
SELECT setval('game_pc_id_seq', COALESCE((SELECT MAX(id) FROM "Game_pc"), 0) + 1, false);
