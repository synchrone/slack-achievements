import { renderLeaderboard } from "../features/reactionSummary"

describe('Reactions Summary', () => {
    test('renderLeaderboard', async () => {
        const lb = renderLeaderboard([
                {
                    "count": 26,
                    "toUser": "U0FE0GSDP",
                    "reaction": "revolut"
                },
                {
                    "count": 22,
                    "toUser": "U0TA2FKBM",
                    "reaction": "heavy_plus_sign"
                },
                {
                    "count": 21,
                    "toUser": "UK0N1M53N",
                    "reaction": "sad_frog"
                },
                {
                    "count": 19,
                    "toUser": "URZDEDT45",
                    "reaction": "oru"
                },
                {
                    "count": 17,
                    "toUser": "U1NKP4VKN",
                    "reaction": "heavy_plus_sign"
                },
                {
                    "count": 14,
                    "toUser": "U4GTLM2PR",
                    "reaction": "heavy_plus_sign"
                },
                {
                    "count": 13,
                    "toUser": "UGKF9PHJN",
                    "reaction": "heavy_plus_sign"
                },
                {
                    "count": 11,
                    "toUser": "U0H9TJQSV",
                    "reaction": "heavy_plus_sign"
                },
                {
                    "count": 10,
                    "toUser": "UGKF9PHJN",
                    "reaction": "heavy_minus_sign"
                },
                {
                    "count": 10,
                    "toUser": "UK0N1M53N",
                    "reaction": "heavy_plus_sign"
                }
        ])
        expect(lb).not.toBe(undefined)
    })
})