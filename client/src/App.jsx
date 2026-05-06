

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Xin chào từ E-Library! 📚
        </h1>
        <p className="text-gray-600 mb-6">
          Dự án quản lý thư viện số của nhóm đã khởi tạo thành công với 
          <span className="font-semibold text-teal-500"> React + Vite + Tailwind</span>.
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-all duration-300">
          Bắt đầu thôi!
        </button>
      </div>
    </div>
  );
}

export default App;
