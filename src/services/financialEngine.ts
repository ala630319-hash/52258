/**
 * Master Financial Engine (محرك الحسابات المالية المركزي)
 * Strictly follows Master Prompt specifications (Sections 13, 14, 15, 16, 17, 18, 19, 21, 25).
 * All monetary amounts are handled with fixed 2-decimal precision.
 */

import {
  Installment,
  InstallmentDuration,
  InstallmentPlan,
  InstallmentStatus,
  Payment,
  PlanStatus,
} from '../types';

export class FinancialEngine {
  /**
   * Round to 2 decimal places strictly.
   */
  public static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Compute remaining amount for plan:
   * remaining = totalAmount - downPayment
   */
  public static calculateRemainingAmount(totalAmount: number, downPayment: number): number {
    const total = this.round2(totalAmount);
    const down = this.round2(downPayment);
    if (down > total) {
      throw new Error('الدفعة الأولى لا يمكن أن تكون أكبر من إجمالي المبلغ');
    }
    return this.round2(total - down);
  }

  /**
   * Safe month addition avoiding day overflow errors (handles Jan 31 -> Feb 28/29, etc.)
   */
  public static addMonthsSafe(startDateStr: string, monthsToAdd: number): string {
    const [yearStr, monthStr, dayStr] = startDateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const day = parseInt(dayStr, 10);

    const targetDate = new Date(year, month + monthsToAdd, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    // Get maximum days in target month
    const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const safeDay = Math.min(day, maxDaysInTargetMonth);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${targetYear}-${pad(targetMonth + 1)}-${pad(safeDay)}`;
  }

  /**
   * Generates installments array for a plan.
   * Section 13: 1st installment date = plan creation/approval date, due immediately!
   * Section 16: Base installment = floor(remaining / count). Fractions absorbed in last installment.
   * Section 17: Date N = Date 1 + (N - 1) months with safe month-end.
   */
  public static generateInstallments(
    planId: string,
    remainingAmount: number,
    durationMonths: InstallmentDuration,
    startDateStr: string, // YYYY-MM-DD
    todayStr?: string
  ): Omit<Installment, 'id'>[] {
    const remaining = this.round2(remainingAmount);
    if (remaining <= 0) {
      throw new Error('المبلغ المتبقي للأقساط يجب أن يكون أكبر من الصفر');
    }

    const count = durationMonths;
    // Base amount rounded down to 2 decimals
    const baseAmount = Math.floor((remaining / count) * 100) / 100;
    const installments: Omit<Installment, 'id'>[] = [];

    let sumAllocated = 0;
    const today = todayStr || new Date().toISOString().split('T')[0];

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      let installmentAmount: number;

      if (isLast) {
        // Last installment absorbs the exact difference
        installmentAmount = this.round2(remaining - sumAllocated);
      } else {
        installmentAmount = baseAmount;
        sumAllocated = this.round2(sumAllocated + installmentAmount);
      }

      // Safe date calculation:
      // Installment 1 = startDate (creation date)
      // Installment N = startDate + (N - 1) months
      const dueDate = this.addMonthsSafe(startDateStr, i - 1);

      // Determine initial status:
      // Installment 1 is due immediately on creation date.
      // If due date is strictly in the past compared to today, it's overdue.
      let status: InstallmentStatus = 'due';
      if (dueDate < today) {
        status = 'overdue';
      }

      installments.push({
        plan_id: planId,
        installment_number: i,
        amount: installmentAmount,
        paid_amount: 0,
        remaining_amount: installmentAmount,
        due_date: dueDate,
        status,
        notes: i === 1 ? 'القسط الأول المستحق فور إنشاء الخطة' : undefined,
      });
    }

    // Double check financial invariant
    const totalSum = installments.reduce((acc, inst) => this.round2(acc + inst.amount), 0);
    if (this.round2(totalSum) !== remaining) {
      throw new Error(
        `Financial Engine Invariant Violated: Sum of installments (${totalSum}) != Remaining (${remaining})`
      );
    }

    return installments;
  }

  /**
   * Recalculates an installment's status based on paid amount, total amount, and due date.
   */
  public static calculateInstallmentStatus(
    amount: number,
    paidAmount: number,
    dueDate: string,
    currentDateStr?: string
  ): InstallmentStatus {
    const today = currentDateStr || new Date().toISOString().split('T')[0];
    const amt = this.round2(amount);
    const paid = this.round2(paidAmount);

    if (paid >= amt) {
      return 'paid';
    }
    if (paid > 0) {
      return 'partially_paid';
    }
    if (dueDate < today) {
      return 'overdue';
    }
    return 'due';
  }

  /**
   * Determines the overall plan status based on all its installments.
   */
  public static calculatePlanStatus(
    plan: Pick<InstallmentPlan, 'status'>,
    installments: Pick<Installment, 'status' | 'remaining_amount'>[]
  ): PlanStatus {
    if (plan.status === 'draft') return 'draft';
    if (plan.status === 'cancelled') return 'cancelled';

    if (installments.length === 0) return 'approved';

    const allPaid = installments.every((inst) => inst.status === 'paid' || inst.remaining_amount <= 0);
    if (allPaid) {
      return 'completed';
    }

    const hasOverdue = installments.some((inst) => inst.status === 'overdue');
    if (hasOverdue) {
      return 'overdue';
    }

    return 'active';
  }

  /**
   * Validates and applies a payment to an installment.
   * Returns updated installment and new payment record info.
   */
  public static applyPayment(
    installment: Installment,
    paymentAmount: number,
    todayStr?: string
  ): {
    updatedInstallment: Installment;
    amountApplied: number;
  } {
    const amount = this.round2(paymentAmount);
    if (amount <= 0) {
      throw new Error('مبلغ الدفعة يجب أن يكون أكبر من الصفر');
    }

    const remainingBefore = this.round2(installment.remaining_amount);
    if (amount > remainingBefore) {
      throw new Error(
        `المبلغ المدخل (${amount}) يتجاوز المتبقي من القسط (${remainingBefore})`
      );
    }

    const newPaid = this.round2(installment.paid_amount + amount);
    const newRemaining = this.round2(installment.amount - newPaid);
    const newStatus = this.calculateInstallmentStatus(
      installment.amount,
      newPaid,
      installment.due_date,
      todayStr
    );

    const updatedInstallment: Installment = {
      ...installment,
      paid_amount: newPaid,
      remaining_amount: Math.max(0, newRemaining),
      status: newStatus,
      last_payment_date: todayStr || new Date().toISOString(),
    };

    return {
      updatedInstallment,
      amountApplied: amount,
    };
  }

  /**
   * Reverses an existing payment.
   * Restores paid amount and recalculates status without deleting historical payment records.
   */
  public static reversePayment(
    installment: Installment,
    payment: Payment,
    todayStr?: string
  ): {
    updatedInstallment: Installment;
    reversedAmount: number;
  } {
    if (payment.status === 'reversed') {
      throw new Error('هذه الدفعة معكوسة بالفعل مسبقاً');
    }

    const amount = this.round2(payment.amount);
    const newPaid = this.round2(installment.paid_amount - amount);
    if (newPaid < 0) {
      throw new Error('لا يمكن عكس دفعة تجعل رصيد القسط المدفوع سالباً');
    }

    const newRemaining = this.round2(installment.amount - newPaid);
    const newStatus = this.calculateInstallmentStatus(
      installment.amount,
      newPaid,
      installment.due_date,
      todayStr
    );

    const updatedInstallment: Installment = {
      ...installment,
      paid_amount: newPaid,
      remaining_amount: newRemaining,
      status: newStatus,
    };

    return {
      updatedInstallment,
      reversedAmount: amount,
    };
  }

  /**
   * Formats a financial amount with currency (e.g., 2,500.00 ر.س)
   */
  public static formatCurrency(amount: number, currency = 'ر.س'): string {
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency}`;
  }

  /**
   * English/standard number format (e.g., 2,500.00 SAR)
   */
  public static formatCurrencyEn(amount: number, currency = 'SAR'): string {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency}`;
  }

  /**
   * Converts a numeric amount to Arabic words for receipts (Tafqeet).
   */
  public static numberToArabicWords(amount: number): string {
    const integerPart = Math.floor(amount);
    const fractionalPart = Math.round((amount - integerPart) * 100);

    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const thousands = ['', 'ألف', 'ألفان', 'آلاف', 'ألفاً'];

    function convertGroup(n: number): string {
      let res = '';
      const h = Math.floor(n / 100);
      const rem = n % 100;
      if (h > 0) res += hundreds[h];

      if (rem > 0) {
        if (res.length > 0) res += ' و';
        if (rem <= 10) {
          res += ones[rem];
        } else if (rem < 20) {
          if (rem === 11) res += 'أحد عشر';
          else if (rem === 12) res += 'اثنا عشر';
          else res += ones[rem - 10] + ' عشر';
        } else {
          const u = rem % 10;
          const t = Math.floor(rem / 10);
          if (u > 0) {
            res += ones[u] + ' و' + tens[t];
          } else {
            res += tens[t];
          }
        }
      }
      return res;
    }

    let text = '';
    if (integerPart === 0) {
      text = 'صفر';
    } else if (integerPart < 1000) {
      text = convertGroup(integerPart);
    } else if (integerPart < 1000000) {
      const th = Math.floor(integerPart / 1000);
      const rem = integerPart % 1000;
      let thWord = '';
      if (th === 1) thWord = thousands[1];
      else if (th === 2) thWord = thousands[2];
      else if (th >= 3 && th <= 10) thWord = `${convertGroup(th)} ${thousands[3]}`;
      else thWord = `${convertGroup(th)} ${thousands[4]}`;

      text = thWord;
      if (rem > 0) {
        text += ' و' + convertGroup(rem);
      }
    } else {
      text = `${integerPart}`;
    }

    text += ' ريال سعودي';
    if (fractionalPart > 0) {
      text += ` و${fractionalPart} هللة`;
    }
    return text + ' فقط لا غير';
  }
}
