"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertGameEditionsData = exports.editionsFor = exports.VARIATIONS = exports.VARIATIONS_GAME_COUNT = void 0;
// Seeds physical editions onto the game the storefront's home page shows
// first (lowest id, since GamesService.fetchGames defaults to `orderBy: {
// id: 'asc' }`), per physical-editions-spec.md Feature 1's "Out of scope"
// note: editions are seeded, not created from the storefront. The E2E suite
// (packages/e2e/tests/physical-editions.spec.ts) assumes this exact game and
// these exact edition names, via card index 0.
exports.VARIATIONS_GAME_COUNT = 30;
// Stock 0 is sold out. Both editions at 0 is a game with nothing to buy.
exports.VARIATIONS = [
    { standard: { stock: 25, discount: 0 }, collector: { stock: 0, discount: 0 } },
    { standard: { stock: 40, discount: 0 }, collector: { stock: 15, discount: 0 } },
    { standard: { stock: 3, discount: 0 }, collector: { stock: 8, discount: 10 } },
    { standard: { stock: 0, discount: 0 }, collector: { stock: 5, discount: 0 } },
    { standard: { stock: 12, discount: 15 }, collector: { stock: 2, discount: 0 } },
    { standard: { stock: 0, discount: 0 }, collector: { stock: 0, discount: 0 } },
    { standard: { stock: 60, discount: 20 }, collector: { stock: 0, discount: 0 } },
];
var editionsFor = function (game, _a) {
    var standard = _a.standard, collector = _a.collector;
    return [
        __assign({ gameId: game.id, name: 'Standard Physical Edition', price: game.price + 10, description: 'Physical disc case only, no bonus items.' }, standard),
        __assign({ gameId: game.id, name: "Collector's Edition", price: game.price + 40, description: 'Steelbook case, 80-page art book, 3 enamel pins, and a double-sided world map poster.' }, collector),
    ];
};
exports.editionsFor = editionsFor;
var insertGameEditionsData = function (prismaClient) { return __awaiter(void 0, void 0, void 0, function () {
    var firstGame, others, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, prismaClient.game_pc.findFirst({ orderBy: { id: 'asc' } })];
            case 1:
                firstGame = _a.sent();
                if (!firstGame) {
                    throw new Error('No games to attach editions to - run insertGamesData first');
                }
                return [4 /*yield*/, prismaClient.gameEdition.createMany({
                        data: [
                            {
                                gameId: firstGame.id,
                                name: 'Standard Physical Edition',
                                price: firstGame.price + 10,
                                discount: 0,
                                stock: 25,
                                description: 'Physical disc case only, no bonus items.',
                            },
                            {
                                gameId: firstGame.id,
                                name: "Collector's Edition",
                                price: firstGame.price + 40,
                                discount: 0,
                                stock: 0,
                                description: 'Steelbook case, 80-page art book, 3 enamel pins, and a double-sided world map poster.',
                            },
                        ],
                    })
                    // The next 29 games get both editions too, but each follows a different
                    // pattern, so the storefront shows sold-out, low-stock, discounted and
                    // fully stocked editions. The first game above stays fixed for the E2E suite.
                ];
            case 2:
                _a.sent();
                return [4 /*yield*/, prismaClient.game_pc.findMany({
                        where: { id: { gt: firstGame.id } },
                        orderBy: { id: 'asc' },
                        take: exports.VARIATIONS_GAME_COUNT - 1,
                    })];
            case 3:
                others = _a.sent();
                return [4 /*yield*/, prismaClient.gameEdition.createMany({
                        data: others.flatMap(function (game, index) { return (0, exports.editionsFor)(game, exports.VARIATIONS[index % exports.VARIATIONS.length]); }),
                    })];
            case 4:
                _a.sent();
                console.log("Inserted physical editions for: ".concat(firstGame.title, " and ").concat(others.length, " more games"));
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                console.error('Error inserting game editions:', error_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.insertGameEditionsData = insertGameEditionsData;
