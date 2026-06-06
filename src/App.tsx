import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import MainLayout from "@/components/Layout/MainLayout";
import Home from "@/pages/Home";
import ApiList from "@/pages/ApiList";
import ApiDetail from "@/pages/ApiDetail";
import Debug from "@/pages/Debug";
import TestCases from "@/pages/TestCases";
import Changes from "@/pages/Changes";
import Members from "@/pages/Members";
import ErrorCodes from "@/pages/ErrorCodes";

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: "#1677ff" } }}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/api" element={<ApiList />} />
            <Route path="/api/:id" element={<ApiDetail />} />
            <Route path="/debug/:id?" element={<Debug />} />
            <Route path="/test-cases" element={<TestCases />} />
            <Route path="/changes" element={<Changes />} />
            <Route path="/members" element={<Members />} />
            <Route path="/error-codes" element={<ErrorCodes />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  );
}
