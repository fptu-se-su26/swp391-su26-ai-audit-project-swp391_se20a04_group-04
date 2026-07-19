const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

/**
 * SWT301 - Week 7: Page Object Model
 * Project: EcoSchedule
 * Page: Manager Dashboard / Complaint approval
 *
 * Traceability:
 * - FR-MAN-COM-01: Manager views complaints.
 * - FR-MAN-COM-04: Manager approves a resolved complaint.
 * - Complaint state: RESOLVED_PENDING_APPROVAL -> CLOSED.
 */
class ManagerDashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;

    // Page identity and resident complaint section.
    this.managerName = page
      .getByText('Test Manager', { exact: true })
      .first();

    this.complaintSection = page
      .getByText('Phản ánh cư dân', { exact: true })
      .first();

    this.complaintItem = page
      .getByText('Rác ngập tràn chưa dọn', { exact: true })
      .first();

    // Pending approval section.
    this.pendingApprovalTitle = page
      .getByText('Phản ánh chờ duyệt', { exact: true })
      .first();

    this.feedbackItem = page
      .getByText('Thùng rác hỏng tại ngã tư', { exact: true })
      .first();

    this.approveButton = page
      .getByRole('button', { name: 'Duyệt', exact: true })
      .first();

    // Result after successful approval.
    this.approveSuccess = page
      .getByText(
        'Đã duyệt phản ánh. Cư dân sẽ nhận thông báo.',
        { exact: true }
      )
      .first();
  }

  /** Open Manager dashboard directly. */
  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.verifyLoaded();
    return this;
  }

  /** Verify that the Manager dashboard and complaint data loaded. */
  async verifyLoaded() {
    await expect(this.managerName).toBeVisible();
    await expect(this.complaintSection).toBeVisible();
    await expect(this.complaintItem).toBeVisible();
    return this;
  }

  /** Verify that a complaint is waiting for Manager approval. */
  async verifyPendingApprovalVisible() {
    await this.pendingApprovalTitle.scrollIntoViewIfNeeded();
    await expect(this.pendingApprovalTitle).toBeVisible();
    await expect(this.feedbackItem).toBeVisible();
    await expect(this.approveButton).toBeVisible();
    await expect(this.approveButton).toBeEnabled();
    return this;
  }

  /** Approve the first complaint in the pending approval section. */
  async approveFirstFeedback() {
    await this.verifyPendingApprovalVisible();
    await this.approveButton.click();
    return this;
  }

  /** Verify successful transition from pending approval to closed. */
  async verifyApprovalCompleted() {
    await expect(this.approveSuccess).toBeVisible();
    await expect(this.feedbackItem).toBeHidden();
    await expect(this.approveButton).toBeHidden();
    return this;
  }

  /** Fluent action: approve the first feedback and verify the result. */
  async approveAndVerifyFirstFeedback() {
    await this.approveFirstFeedback();
    await this.verifyApprovalCompleted();
    return this;
  }
}

module.exports = { ManagerDashboardPage };
