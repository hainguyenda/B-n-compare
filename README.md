# Bản Đồ Studio

App dựng video xếp hạng các nước (bản đồ sáng lên, cột 3D, countryball) cho kênh YouTube. Dán code JSON, xem thử, rồi xuất thẳng ra file .mp4 trong trình duyệt.

- `src/index.html`: toàn bộ app
- `src/ball.js`: chế độ countryball
- `vercel.json`: Vercel phục vụ thư mục `src/`, không cần build

## Kiểu hình

`"mode"` trong code, hoặc ô **Kiểu hình** trong app:

| mode | Hình ảnh |
| --- | --- |
| `map` | Bản đồ phẳng, nước lần lượt sáng lên |
| `stack` | Cột 3D to dần |
| `split` | Cột 3D kèm bản đồ nhỏ |
| `ball` | Countryball nhí nhảnh |
| `globe` | Quả địa cầu xoay tới từng nước, cột sáng cao theo giá trị, tiếng vút mỗi lần xoay |
| `bubble` | Bản đồ phẳng, bong bóng to theo giá trị mọc lên trên từng nước |

Ví dụ đầy đủ: `examples/qua-dia-cau-ca-phe.json`.

## Tính năng giữ chân người xem

| Trường | Tác dụng |
| --- | --- |
| `quiz: true` hoặc `quiz: ["Russia", "IN", "United States"]` | Mở đầu video là câu đố "WHO IS #1?" A/B/C có thanh đếm ngược và tiếng tích tắc; tới lúc lộ #1 hiện "✓ ANSWER B: ...". Đổi chữ bằng `quizTitle`, `quizCta`. |
| `endCard` | Cảnh cuối nhờ Like, Share, Subscribe; mặc định luôn bật (kênh "World Compared"), `endCard: false` để tắt, `{ "channel", "handle", "text" }` để đổi chữ. Câu hỏi cuối (`question`) chỉ hiện khi tự ghi. |
| `fact` trong từng nước | Một dòng thông tin thú vị hiện ở dưới khi nước đó lên hình. |
| `spotlight: "VN"` hoặc `{ code: "VN", rank: 16, value: 101300000, say: "..." }` | Nước có trong danh sách thì hiện băng rôn đỏ "VIETNAM IS #2!". Không có thì sau danh sách hiện thẻ "AND VIETNAM? #16". |

Ví dụ:

```json
{
  "title": "The 10 Biggest Coffee Producers",
  "unit": "tonnes",
  "quiz": true,
  "spotlight": "VN",
  "countries": [
    { "code": "BR", "value": 3900000, "fact": "Grows about 1 in 3 coffee beans on Earth" },
    { "code": "VN", "value": 1800000, "fact": "Mostly robusta, the strong bitter bean" }
  ]
}
```

## Kiểm tra khi sửa

`tools/shots.cjs` dựng vài khung hình của một file cấu hình ra ảnh PNG, `tools/compare.cjs` so từng điểm ảnh giữa hai địa chỉ (ví dụ bản đang chạy với bản đang sửa). Cả hai cần Playwright.
