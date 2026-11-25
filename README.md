# Bản Đồ Studio

App dựng video xếp hạng các nước (bản đồ sáng lên, cột 3D, countryball) cho kênh YouTube. Dán code JSON, xem thử, rồi xuất thẳng ra file .mp4 trong trình duyệt.

- `src/index.html`: toàn bộ app
- `src/ball.js`: chế độ countryball
- `vercel.json`: Vercel phục vụ thư mục `src/`, không cần build

## Công thức Shorts (khung 9:16)

Rút ra từ Short duy nhất của kênh vượt 1.000 view ("Which Country Exports the Most?"), app tự áp dụng cho khung 9:16:

- Khung hình đầu tiên đã có đủ: câu chữ lớn (`hook`, ví dụ `"WHO IS #1|IN EXPORTS?"`) và bục top 3 với #2, #3 lộ tên, #1 là ???. Không còn chữ hiện chậm trên nền trống.
- 1,6 giây mỗi nước, mở đầu 2,5 giây (3 giây nếu có câu đố): 10 nước khoảng 20 giây.
- Nhạc nhanh, có tiếng vút mỗi khi nước mới hiện.
- Không có cảnh Like/Subscribe, không mờ dần ở cuối: hiện toàn cảnh top 10 kèm câu hỏi lớn "Is your country in the top 10? Tell us below", rồi video lặp lại.

Nên dùng `"mode": "stack"` cho Shorts. Ví dụ: `examples/short-ca-phe.json`. Video dài 16:9 giữ nhịp 2,4 giây và cảnh Like/Share/Subscribe.

## Kiểu hình

`"mode"` trong code, hoặc ô **Kiểu hình** trong app:

| mode | Hình ảnh |
| --- | --- |
| `map` | Bản đồ phẳng, nước lần lượt sáng lên |
| `stack` | Cột 3D to dần |
| `stack2` | Cột 3D v2: chữ to đọc được trên điện thoại; cột được xếp từng khối rơi xuống (tiếng "cạch" dồn dập dần); #1 vọt quá mép trên rồi máy quay ngước theo, rung khi chạm đỉnh; kết bằng bảng xếp hạng to có cờ và số. Bản `stack` giữ nguyên để so sánh. Ví dụ: `examples/short-ca-phe-v2.json` |
| `ballstack` | Countryball ngồi trên đỉnh một đống, chạy giống `stack2` (từng tầng rơi xuống, #1 vọt quá mép trên, bảng tổng kết). `"stack": "cars"` là đống xe hơi hoạt hình (xe sedan, SUV, bán tải nhiều màu); bóng nhún lên theo đống, #1 đội vương miện, #2 tròn mắt khi #1 hiện ra. Chất liệu khác thì bóng ngồi trên nóc cột 3D. Nền trời hoạt hình theo ô **Nền bóng**. Ví dụ: `examples/short-o-to-ballstack.json` |
| `split` | Cột 3D kèm bản đồ nhỏ |
| `ball` | Countryball nhí nhảnh |
| `globe` | Quả địa cầu xoay tới từng nước, cột sáng cao theo giá trị, tiếng vút mỗi lần xoay |
| `bubble` | Bản đồ phẳng, bong bóng to theo giá trị mọc lên trên từng nước |
| `race` | Đường đua, cả đường đua nằm trọn trong một khung (9:16 chạy từ dưới lên, 16:9 chạy ngang). Các nước chạy cùng nhau thành đàn, nước nào gần hết số liệu thì đuối dần (mắt lim dim, lè lưỡi thở dốc, đổ mồ hôi), chậm lại rồi dừng đúng ở số liệu của mình; #1 chạy tiếp một mình về đích có pháo giấy. Vạch trên đường là mốc số liệu. Nên dùng tối đa khoảng 12 nước. Ví dụ: `examples/duong-dua-ca-phe.json` |

Ví dụ đầy đủ: `examples/qua-dia-cau-ca-phe.json`.

## Tính năng giữ chân người xem

| Trường | Tác dụng |
| --- | --- |
| `quiz: true` hoặc `quiz: ["Russia", "IN", "United States"]` | Mở đầu video: câu chữ lớn "WHO IS #1?" (hoặc `hook`) cùng hàng đáp án A/B/C nhỏ ở dưới, không che bục top 3, có tiếng tích tắc; tới lúc lộ #1 hiện "✓ ANSWER B: ...". Đổi chữ bằng `quizTitle`, `quizCta`. |
| `endCard` | Cảnh cuối nhờ Like, Share, Subscribe; mặc định bật cho video dài, tắt cho Shorts. `endCard: false` để tắt, `{ "channel", "handle", "text" }` để bật/đổi chữ. |
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
