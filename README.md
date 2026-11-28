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
| `ballstack` | Countryball ngồi trên đỉnh một đống, chạy giống `stack2` (từng tầng rơi xuống, #1 vọt quá mép trên, bảng tổng kết). `"stack": "cars"` là đống xe hơi hoạt hình (xe sedan, SUV, bán tải nhiều màu); bóng nhún lên theo đống, #1 đội vương miện, #2 tròn mắt khi #1 hiện ra. Chất liệu khác thì bóng ngồi trên nóc cột 3D. Nền trời hoạt hình theo ô **Nền bóng**. Dùng được cho cả Short 9:16 và video dài 16:9 (đã thử 30 nước, có thẻ "AND VIETNAM?", thẻ kết và cảnh Like/Subscribe). Ví dụ: `examples/short-o-to-ballstack.json`, `examples/video-dai-ballstack.json` |
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

## TikTok

Khung **9:16 · TikTok** vẽ cảnh 9:16 bình thường rồi thu nhỏ 80% vào vùng an toàn (cách trên 150px, trái 64px, chừa cột nút bên phải và phần chú thích bên dưới), nền xung quanh là bản mờ tối của chính cảnh đó; luôn tắt endCard (cảnh Like/Share/Subscribe của YouTube). `"format": "tiktok"` trong code tự chọn khung này khi bấm Chạy (`"shorts"` / `"youtube"` cho hai khung kia).

## Tab 2 — Countryball Showdown

Nút **Countryball Showdown** ở đầu trang mở studio thứ hai (code trong `src/showdown.js`), dùng chung khung xem trước, nhạc nền và bộ xuất MP4 với Tab 1 (Tab 1 không đổi). Code là một danh sách `scenes`:
`lineup` (dàn hàng xéo, bóng sau trượt ra từ sau bóng trước có motion blur, `eyeDropAt` đổi mắt sang mắt bèn đúng nhịp bass), `stat_battle` (2–5 nước, thanh số chạy, nước thắng sáng vàng, nước thua mắt run và tối đi), `champion` (bóng vô địch trượt vào giữa, tia sáng xoay, phụ kiện `sunglasses` / `cigar` / `trophy` / `crown`, mưa kim tuyến).
Mắt: `normal`, `serious`, `angry`, `shocked`, `cool`, chuyển mượt trong 120 ms. `bpm`, `beatIntensity`: mỗi nhịp khung hình nhún zoom, rung nhẹ, bóng nhún dẹt. Nhạc tự tạo là beat kiểu phonk đúng bpm; với file nhạc riêng và **Auto Beat-Sync** bật, app dò nhịp bass trong file. Nút "Nạp mẫu ASEAN vs Việt Nam Top 1" có sẵn một video mẫu 13,5 giây.

## Kiểu `feast` — bóng há miệng ăn

`"mode": "feast"` (menu: "Bóng há miệng ăn"): từng nước là một quả bóng há miệng, đoàn người tí hon kéo vali chạy ùa vào từ bên phải rồi nhảy vào miệng, quả bóng to dần đến đúng số rồi nhai. Hạng 1 vẫn là bóng đen "?" cho tới lúc lộ. Cảnh cuối: camera lùi xem top 3 rồi áp sát #1, quả bóng ợ "BURP!", rơi kính đen, đội vương miện, ôm cúp, rồi hiện câu hỏi cuối. Có tiếng nhai, tiếng bước chân, tiếng ợ. Đi cùng câu đố, hook, thẻ Việt Nam như kiểu `ball`. Outro mặc định 5,2 giây.
