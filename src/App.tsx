/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SmoothScroll } from "./components/SmoothScroll";
import { Cursor } from "./components/Cursor";
import { Grain } from "./components/Grain";
import { ScrollManager } from "./components/ScrollManager";
import { WhatsAppProvider } from "./components/WhatsApp";
import { Home } from "./pages/Home";
import { AreaPage } from "./pages/AreaPage";

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <WhatsAppProvider>
          <ScrollManager />
          <Cursor />
          <Grain />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/areas/:slug" element={<AreaPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </WhatsAppProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
}
