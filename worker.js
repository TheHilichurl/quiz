export default {
  async fetch(request, env) {
    // 1. Cấu hình Headers xử lý CORS (cho phép frontend từ mọi nguồn gọi vào)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 2. Xử lý yêu cầu CORS Preflight (OPTIONS request từ trình duyệt)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 3. Xử lý nhận bài thi từ frontend (POST request)
    if (request.method === "POST") {
      try {
        const body = await request.json();

        // Trích xuất thông tin bài thi do client gửi lên
        const {
          studentName,
          score,
          correctCount,
          totalQuestions,
          violations,
          reason,
          timeSpentSeconds,
          timestamp,
        } = body;

        // In ra log để xem trực tiếp tại mục Logs trên Cloudflare Dashboard
        console.log(`[BÀI THI MỚI] ${new Date().toLocaleString("vi-VN")}:`, {
          "Họ tên": studentName,
          "Điểm": `${score}/10`,
          "Số câu đúng": `${correctCount}/${totalQuestions}`,
          "Số lần đổi tab": violations,
          "Hình thức nộp": reason === "tab_violation_limit" ? "Cưỡng chế nộp bài (thoát tab)" : "Tự nộp",
          "Thời gian làm bài": `${timeSpentSeconds} giây`,
          "Thời điểm": timestamp,
        });

        // Nếu có gắn Cloudflare KV (ví dụ tên biến là QUIZ_KV), có thể bỏ comment dòng dưới để lưu:
        // if (env.QUIZ_KV) await env.QUIZ_KV.put(`${studentName}_${Date.now()}`, JSON.stringify(body));

        return new Response(
          JSON.stringify({
            status: "success",
            message: "Đã ghi nhận kết quả bài kiểm tra",
            student: studentName,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json;charset=UTF-8",
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Dữ liệu JSON không hợp lệ hoặc thiếu thông tin: " + err.message,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json;charset=UTF-8",
            },
          }
        );
      }
    }

    // 4. Phản hồi mặc định khi vào kiểm tra đường link trên trình duyệt (GET request)
    return new Response("Hệ thống chấm trắc nghiệm đang hoạt động bình thường.", {
      status: 200,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    });
  },
};
