import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TradeDesk from './pages/products/TradeDesk'
import ComplianceEngine from './pages/products/ComplianceEngine'
import AuditLedger from './pages/products/AuditLedger'
import Traders from './pages/solutions/Traders'
import Finance from './pages/solutions/Finance'
import Sovereigns from './pages/solutions/Sovereigns'
import Pricing from './pages/Pricing'
import DocsIndex from './pages/docs/DocsIndex'
import ApiReference from './pages/docs/ApiReference'
import DocStubPage from './pages/docs/Stub'
import Walkthrough from './pages/Walkthrough'
import Auth from './pages/Auth'
import Trust from './pages/Trust'
import Status from './pages/Status'
import LiveDemo from './pages/LiveDemo'
import Checkout from './pages/Checkout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/trade-desk" element={<TradeDesk />} />
        <Route path="/products/compliance-engine" element={<ComplianceEngine />} />
        <Route path="/products/audit-ledger" element={<AuditLedger />} />
        <Route path="/solutions/traders" element={<Traders />} />
        <Route path="/solutions/finance" element={<Finance />} />
        <Route path="/solutions/sovereigns" element={<Sovereigns />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/api" element={<ApiReference />} />
        <Route path="/docs/quickstart" element={<DocStubPage />} />
        <Route path="/docs/authentication" element={<DocStubPage />} />
        <Route path="/docs/matches" element={<DocStubPage />} />
        <Route path="/docs/counterparties" element={<DocStubPage />} />
        <Route path="/docs/evidence" element={<DocStubPage />} />
        <Route path="/docs/webhooks" element={<DocStubPage />} />
        <Route path="/docs/api-pricing" element={<DocStubPage />} />
        <Route path="/docs/errors" element={<DocStubPage />} />
        <Route path="/walkthrough" element={<Walkthrough />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/status" element={<Status />} />
        <Route path="/live-demo" element={<LiveDemo />} />
        <Route path="/checkout/:sessionId" element={<Checkout />} />
      </Routes>
    </BrowserRouter>
  )
}
