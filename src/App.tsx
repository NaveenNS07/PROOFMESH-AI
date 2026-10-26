/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { LandingPage, AuthPage, PublicVerifyPage } from './pages/LandingAndAuthPages';
import {
  DashboardPage,
  WorkQueuePage,
  ApplicationRegistryPage,
  ApplicationIntakePage,
} from './pages/OverviewPages';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import {
  DocumentIntelligencePage,
  ValidationCenterPage,
  EvidenceGraphPage,
  ChangeImpactPage,
  ComplianceCenterPage,
} from './pages/IntelligencePages';
import {
  SourceVerificationPage,
  InfrastructureReviewPage,
  ReportsCenterPage,
  AuditTrailPage,
  NotificationsPage,
} from './pages/VerificationAndReportingPages';
import {
  AdminUsersPage,
  AdminRulesPage,
  AdminDataSourcesPage,
  ProfileSettingsPage,
  SystemSettingsPage,
} from './pages/AdminAndSettingsPages';

const WithShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppShell>{children}</AppShell>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<AuthPage />} />
          <Route path="/public/verify" element={<PublicVerifyPage />} />

          {/* Overview Workspace Routes */}
          <Route
            path="/dashboard"
            element={
              <WithShell>
                <DashboardPage />
              </WithShell>
            }
          />
          <Route
            path="/work-queue"
            element={
              <WithShell>
                <WorkQueuePage />
              </WithShell>
            }
          />
          <Route
            path="/applications"
            element={
              <WithShell>
                <ApplicationRegistryPage />
              </WithShell>
            }
          />
          <Route
            path="/applications/new"
            element={
              <WithShell>
                <ApplicationIntakePage />
              </WithShell>
            }
          />
          <Route
            path="/applications/:applicationId"
            element={
              <WithShell>
                <ApplicationDetailPage />
              </WithShell>
            }
          />

          {/* Intelligence Workspace Routes */}
          <Route
            path="/document-intelligence"
            element={
              <WithShell>
                <DocumentIntelligencePage />
              </WithShell>
            }
          />
          <Route
            path="/validation-center"
            element={
              <WithShell>
                <ValidationCenterPage />
              </WithShell>
            }
          />
          <Route
            path="/evidence-graph"
            element={
              <WithShell>
                <EvidenceGraphPage />
              </WithShell>
            }
          />
          <Route
            path="/change-impact"
            element={
              <WithShell>
                <ChangeImpactPage />
              </WithShell>
            }
          />
          <Route
            path="/compliance"
            element={
              <WithShell>
                <ComplianceCenterPage />
              </WithShell>
            }
          />

          {/* Verification & Reporting Routes */}
          <Route
            path="/verification"
            element={
              <WithShell>
                <SourceVerificationPage />
              </WithShell>
            }
          />
          <Route
            path="/infrastructure-review"
            element={
              <WithShell>
                <InfrastructureReviewPage />
              </WithShell>
            }
          />
          <Route
            path="/reports"
            element={
              <WithShell>
                <ReportsCenterPage />
              </WithShell>
            }
          />
          <Route
            path="/audit"
            element={
              <WithShell>
                <AuditTrailPage />
              </WithShell>
            }
          />
          <Route
            path="/notifications"
            element={
              <WithShell>
                <NotificationsPage />
              </WithShell>
            }
          />

          {/* Administration & Settings Routes */}
          <Route
            path="/admin/users"
            element={
              <WithShell>
                <AdminUsersPage />
              </WithShell>
            }
          />
          <Route
            path="/admin/rules"
            element={
              <WithShell>
                <AdminRulesPage />
              </WithShell>
            }
          />
          <Route
            path="/admin/data-sources"
            element={
              <WithShell>
                <AdminDataSourcesPage />
              </WithShell>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <WithShell>
                <ProfileSettingsPage />
              </WithShell>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <WithShell>
                <SystemSettingsPage />
              </WithShell>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
