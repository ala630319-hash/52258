/**
 * Automated Test Suite Runner (Section 44 - الاختبارات الآلية)
 * Validates financial invariants, installment fractions, edge-case dates, payment rules, and reversibility.
 */

import { FinancialEngine } from './financialEngine';
import { Installment, InstallmentDuration, Payment } from '../types';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'financial' | 'first_installment' | 'payments' | 'dates' | 'permissions';
  passed: boolean;
  message: string;
  details?: string;
  durationMs: number;
}

export class TestRunner {
  public static runAllTests(): TestResultItem[] {
    const results: TestResultItem[] = [];

    // --- 1. Calculations: Fractions and Durations ---
    results.push(this.testFractions10000Div3());
    results.push(this.testAllDurationsExactSums());
    results.push(this.testDownPaymentDeduction());

    // --- 2. First Installment Rule (Section 13) ---
    results.push(this.testFirstInstallmentImmediateDue());

    // --- 3. Payments, Partials, Overpayment prevention, Reversals ---
    results.push(this.testFullPayment());
    results.push(this.testPartialPaymentSequence());
    results.push(this.testOverpaymentPrevention());
    results.push(this.testPaymentReversal());

    // --- 4. Edge-case Dates (Section 17) ---
    results.push(this.testMonthEndSafeDates());

    return results;
  }

  private static testFractions10000Div3(): TestResultItem {
    const start = performance.now();
    try {
      // 10,000 SAR divided by 3 months.
      // 10000 / 3 = 3333.33 + 3333.33 + 3333.34 = 10000.00
      const remaining = 10000;
      const duration: InstallmentDuration = 3;
      const installments = FinancialEngine.generateInstallments('plan-test-1', remaining, duration, '2026-09-01');

      const sum = installments.reduce((acc, i) => FinancialEngine.round2(acc + i.amount), 0);
      const passed =
        sum === 10000 &&
        installments[0].amount === 3333.33 &&
        installments[1].amount === 3333.33 &&
        installments[2].amount === 3333.34;

      return {
        id: 'calc_fractions_10k_3',
        name: 'معالجة الكسور بدقة (10,000 ÷ 3 أشهر)',
        category: 'financial',
        passed,
        message: passed
          ? 'تم توزيع الكسور بنجاح: 3333.33 + 3333.33 + 3333.34 = 10,000 تماماً دون أي ضياع'
          : `فشل التحقق: المجموع ${sum} بدلاً من 10000`,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    } catch (e: any) {
      return {
        id: 'calc_fractions_10k_3',
        name: 'معالجة الكسور بدقة (10,000 ÷ 3 أشهر)',
        category: 'financial',
        passed: false,
        message: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    }
  }

  private static testAllDurationsExactSums(): TestResultItem {
    const start = performance.now();
    const durations: InstallmentDuration[] = [2, 3, 4, 6, 9, 12];
    const testAmount = 7777.77;

    for (const d of durations) {
      const installments = FinancialEngine.generateInstallments(`plan-d-${d}`, testAmount, d, '2026-09-01');
      const sum = installments.reduce((acc, i) => FinancialEngine.round2(acc + i.amount), 0);
      if (sum !== testAmount) {
        return {
          id: 'calc_all_durations',
          name: 'اختبار دقة جميع مدد التقسيط (2, 3, 4, 6, 9, 12 شهراً)',
          category: 'financial',
          passed: false,
          message: `فشل في مدة ${d} شهور: المجموع ${sum} != ${testAmount}`,
          durationMs: Math.round((performance.now() - start) * 100) / 100,
        };
      }
    }

    return {
      id: 'calc_all_durations',
      name: 'اختبار دقة جميع مدد التقسيط (2, 3, 4, 6, 9, 12 شهراً)',
      category: 'financial',
      passed: true,
      message: 'اجتازت جميع المدد (2, 3, 4, 6, 9, 12 شهراً) اختبار المجموع المتطابق بدقة 100%',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testDownPaymentDeduction(): TestResultItem {
    const start = performance.now();
    const total = 12000;
    const down = 3000;
    const remaining = FinancialEngine.calculateRemainingAmount(total, down);
    const passed = remaining === 9000;

    return {
      id: 'calc_down_payment',
      name: 'خصم الدفعة الأولى من إجمالي الخطة',
      category: 'financial',
      passed,
      message: passed
        ? `حساب المتبقي صحيح: ${total} - ${down} = ${remaining} ر.س`
        : `خطأ في الحساب: ${remaining}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testFirstInstallmentImmediateDue(): TestResultItem {
    const start = performance.now();
    const creationDate = '2026-09-01';
    const installments = FinancialEngine.generateInstallments('plan-first-rule', 4000, 4, creationDate, '2026-09-01');

    const firstInst = installments[0];
    const isSameDate = firstInst.due_date === creationDate;
    const isDue = firstInst.status === 'due';
    const isZeroPaid = firstInst.paid_amount === 0;

    const passed = isSameDate && isDue && isZeroPaid;
    return {
      id: 'first_installment_rule',
      name: 'قاعدة القسط الأول الإجباري (يبدأ فوراً ومستحق اليوم)',
      category: 'first_installment',
      passed,
      message: passed
        ? 'تاريخ القسط الأول يطابق تاريخ إنشاء الخطة، ومستحق فوراً وغير مسدد تلقائياً.'
        : 'فشل التحقق من تاريخ أو حالة القسط الأول.',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testFullPayment(): TestResultItem {
    const start = performance.now();
    const inst: Installment = {
      id: 'inst-1',
      plan_id: 'p-1',
      installment_number: 1,
      amount: 1500,
      paid_amount: 0,
      remaining_amount: 1500,
      due_date: '2026-09-01',
      status: 'due',
    };

    const result = FinancialEngine.applyPayment(inst, 1500);
    const passed =
      result.updatedInstallment.paid_amount === 1500 &&
      result.updatedInstallment.remaining_amount === 0 &&
      result.updatedInstallment.status === 'paid';

    return {
      id: 'payment_full',
      name: 'تسجيل دفعة كاملة للقسط',
      category: 'payments',
      passed,
      message: passed
        ? 'تم سداد القسط بالكامل وأصبح الرصيد المتبقي 0.00 والحالة "مدفوع"'
        : 'فشل في تحديث حالة القسط بعد السداد الكامل',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testPartialPaymentSequence(): TestResultItem {
    const start = performance.now();
    const inst: Installment = {
      id: 'inst-part',
      plan_id: 'p-1',
      installment_number: 1,
      amount: 1000,
      paid_amount: 0,
      remaining_amount: 1000,
      due_date: '2026-09-01',
      status: 'due',
    };

    // First partial: 600
    const step1 = FinancialEngine.applyPayment(inst, 600);
    const isStep1Correct =
      step1.updatedInstallment.paid_amount === 600 &&
      step1.updatedInstallment.remaining_amount === 400 &&
      step1.updatedInstallment.status === 'partially_paid';

    // Second partial: 400
    const step2 = FinancialEngine.applyPayment(step1.updatedInstallment, 400);
    const isStep2Correct =
      step2.updatedInstallment.paid_amount === 1000 &&
      step2.updatedInstallment.remaining_amount === 0 &&
      step2.updatedInstallment.status === 'paid';

    const passed = isStep1Correct && isStep2Correct;
    return {
      id: 'payment_partial_sequence',
      name: 'الدفعات الجزئية المتتالية (دفع 600 ثم 400 من 1000)',
      category: 'payments',
      passed,
      message: passed
        ? 'تم اختبار الدفع الجزئي بنجاح (مدفوع جزئياً: 600/400) ثم السداد النهائي (1000/0)'
        : 'فشل في تسلسل الدفعات الجزئية',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testOverpaymentPrevention(): TestResultItem {
    const start = performance.now();
    const inst: Installment = {
      id: 'inst-over',
      plan_id: 'p-1',
      installment_number: 1,
      amount: 1000,
      paid_amount: 800,
      remaining_amount: 200,
      due_date: '2026-09-01',
      status: 'partially_paid',
    };

    let prevented = false;
    try {
      FinancialEngine.applyPayment(inst, 250); // exceeds 200
    } catch {
      prevented = true;
    }

    return {
      id: 'payment_overpayment_prevention',
      name: 'منع تجاوز المبلغ المتبقي (حظر الأرصدة السالبة)',
      category: 'payments',
      passed: prevented,
      message: prevented
        ? 'تم رفض محاولة تسجيل 250 ر.س عندما كان المتبقي 200 ر.س بنجاح مع رسالة خطأ صريحة'
        : 'فشل: النظام سمح بتجاوز الرصيد المتبقي!',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testPaymentReversal(): TestResultItem {
    const start = performance.now();
    const inst: Installment = {
      id: 'inst-rev',
      plan_id: 'p-1',
      installment_number: 1,
      amount: 1000,
      paid_amount: 1000,
      remaining_amount: 0,
      due_date: '2026-09-01',
      status: 'paid',
    };

    const payment: Payment = {
      id: 'pay-1',
      payment_number: 'PAY-2026-000001',
      installment_id: 'inst-rev',
      plan_id: 'p-1',
      customer_id: 'c-1',
      amount: 1000,
      paid_at: '2026-09-01T10:00:00Z',
      payment_method: 'cash',
      created_by: 'المدير العام',
      status: 'recorded',
    };

    const revResult = FinancialEngine.reversePayment(inst, payment);
    const passed =
      revResult.updatedInstallment.paid_amount === 0 &&
      revResult.updatedInstallment.remaining_amount === 1000 &&
      revResult.updatedInstallment.status === 'due';

    return {
      id: 'payment_reversal',
      name: 'عكس الدفعة وإعادة فتح القسط المالي بأمان',
      category: 'payments',
      passed,
      message: passed
        ? 'تم عكس الدفعة بدقة: استعادة الرصيد المتبقي إلى 1000 وإعادة القسط لحالة مستحق دون حذف السجل'
        : 'فشل في عكس الدفعة',
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  private static testMonthEndSafeDates(): TestResultItem {
    const start = performance.now();
    // Test Jan 31 + 1 month -> Feb 28 (non-leap)
    const febNonLeap = FinancialEngine.addMonthsSafe('2025-01-31', 1);
    // Test Jan 31 2024 (leap) -> Feb 29 2024
    const febLeap = FinancialEngine.addMonthsSafe('2024-01-31', 1);
    // Test March 31 + 1 month -> April 30
    const apr30 = FinancialEngine.addMonthsSafe('2026-03-31', 1);
    // Test Aug 31 + 1 month -> Sep 30
    const sep30 = FinancialEngine.addMonthsSafe('2026-08-31', 1);

    const passed =
      febNonLeap === '2025-02-28' &&
      febLeap === '2024-02-29' &&
      apr30 === '2026-04-30' &&
      sep30 === '2026-09-30';

    return {
      id: 'dates_month_end',
      name: 'قاعدة التواريخ الآمنة لنهايات الشهور (28، 29 فبراير، 30، 31)',
      category: 'dates',
      passed,
      message: passed
        ? 'تم التحقق من معالجة أطراف الشهور: 31 يناير -> 28/29 فبراير، 31 مارس -> 30 أبريل بدون أخطاء ترحيل'
        : `فشل التحقق: febNonLeap=${febNonLeap}, febLeap=${febLeap}, apr30=${apr30}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }
}
