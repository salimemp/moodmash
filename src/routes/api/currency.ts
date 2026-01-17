// Currency & Taxation API
// Phase 6: Multi-Currency Support and Tax Calculations
import { Hono } from 'hono';
import { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';

const currency = new Hono<{ Bindings: Env; Variables: Variables }>();

// =====================================================
// CURRENCY FORMATTING UTILITIES
// =====================================================
interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
}

function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimal_places,
    maximumFractionDigits: currency.decimal_places
  });
  return formatter.format(amount);
}

function formatCurrencyByLocale(amount: number, currencyCode: string, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode
  });
  return formatter.format(amount);
}

// =====================================================
// GET ALL CURRENCIES
// =====================================================
currency.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const currencies = await db.prepare('SELECT * FROM currencies WHERE is_active = 1 ORDER BY code').all();

    return c.json({
      success: true,
      currencies: currencies.results,
      default: 'USD'
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    return c.json({ error: 'Failed to fetch currencies' }, 500);
  }
});

// =====================================================
// GET EXCHANGE RATES
// =====================================================
currency.get('/rates', async (c) => {
  try {
    const db = c.env.DB;
    const { base = 'USD' } = c.req.query();

    const rates = await db.prepare(`
      SELECT from_currency, to_currency, rate, updated_at 
      FROM exchange_rates 
      WHERE from_currency = ?
    `).bind(base).all();

    return c.json({
      success: true,
      base,
      rates: rates.results,
      last_updated: rates.results?.[0]?.updated_at || new Date().toISOString()
    });
  } catch (error) {
    console.error('Get rates error:', error);
    return c.json({ error: 'Failed to fetch exchange rates' }, 500);
  }
});

// =====================================================
// CONVERT CURRENCY
// =====================================================
currency.get('/convert', async (c) => {
  try {
    const db = c.env.DB;
    const { amount, from = 'USD', to } = c.req.query();

    if (!amount || !to) {
      return c.json({ error: 'amount and to currency are required' }, 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Get exchange rate
    let rate = await db.prepare(`
      SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ?
    `).bind(from, to).first<{ rate: number }>();

    if (!rate) {
      // Try reverse conversion
      const reverseRate = await db.prepare(`
        SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ?
      `).bind(to, from).first<{ rate: number }>();
      
      if (reverseRate) {
        rate = { rate: 1 / reverseRate.rate };
      } else if (from === to) {
        rate = { rate: 1 };
      } else {
        return c.json({ error: 'Exchange rate not found' }, 404);
      }
    }

    const convertedAmount = parsedAmount * rate.rate;

    // Get currency details for formatting
    const toCurrency = await db.prepare('SELECT * FROM currencies WHERE code = ?').bind(to).first<Currency>();

    return c.json({
      success: true,
      from: from,
      to: to,
      original_amount: parsedAmount,
      converted_amount: convertedAmount,
      rate: rate.rate,
      formatted: toCurrency ? formatCurrency(convertedAmount, toCurrency) : convertedAmount.toFixed(2)
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    return c.json({ error: 'Failed to convert currency' }, 500);
  }
});

// =====================================================
// SET USER CURRENCY PREFERENCE
// =====================================================
currency.post('/set', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { currency: currencyCode } = body;

    if (!currencyCode) {
      return c.json({ error: 'Currency code is required' }, 400);
    }

    // Verify currency exists
    const currencyExists = await db.prepare('SELECT code FROM currencies WHERE code = ? AND is_active = 1').bind(currencyCode).first();
    if (!currencyExists) {
      return c.json({ error: 'Invalid currency code' }, 400);
    }

    // Update or insert user preference
    await db.prepare(`
      INSERT INTO user_preferences (user_id, currency)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET currency = ?, updated_at = datetime('now')
    `).bind(userId, currencyCode, currencyCode).run();

    return c.json({
      success: true,
      message: 'Currency preference updated',
      currency: currencyCode
    });
  } catch (error) {
    console.error('Set currency error:', error);
    return c.json({ error: 'Failed to set currency preference' }, 500);
  }
});

// =====================================================
// GET SUBSCRIPTION PRICES
// =====================================================
currency.get('/prices', async (c) => {
  try {
    const db = c.env.DB;
    const { currency: currencyCode = 'USD' } = c.req.query();

    const prices = await db.prepare(`
      SELECT 
        sp.tier_id,
        st.name as tier_name,
        st.description,
        st.features,
        sp.currency,
        sp.price_monthly,
        sp.price_yearly,
        c.symbol,
        c.decimal_places
      FROM subscription_prices sp
      JOIN subscription_tiers st ON sp.tier_id = st.id
      JOIN currencies c ON sp.currency = c.code
      WHERE sp.currency = ? AND sp.is_active = 1 AND st.is_active = 1
      ORDER BY sp.price_monthly
    `).bind(currencyCode).all();

    if (!prices.results?.length) {
      // Fallback to USD prices
      const usdPrices = await db.prepare(`
        SELECT 
          sp.tier_id,
          st.name as tier_name,
          st.description,
          st.features,
          sp.currency,
          sp.price_monthly,
          sp.price_yearly,
          c.symbol,
          c.decimal_places
        FROM subscription_prices sp
        JOIN subscription_tiers st ON sp.tier_id = st.id
        JOIN currencies c ON sp.currency = c.code
        WHERE sp.currency = 'USD' AND sp.is_active = 1 AND st.is_active = 1
        ORDER BY sp.price_monthly
      `).all();
      
      return c.json({
        success: true,
        currency: 'USD',
        prices: usdPrices.results,
        note: `Prices in ${currencyCode} not available, showing USD prices`
      });
    }

    return c.json({
      success: true,
      currency: currencyCode,
      prices: prices.results
    });
  } catch (error) {
    console.error('Get prices error:', error);
    return c.json({ error: 'Failed to fetch prices' }, 500);
  }
});

// =====================================================
// TAX CALCULATION
// =====================================================
currency.get('/tax/calculate', async (c) => {
  try {
    const db = c.env.DB;
    const { amount, region, include_tax = 'false' } = c.req.query();

    if (!amount || !region) {
      return c.json({ error: 'amount and region are required' }, 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Get tax rate for region
    const taxRate = await db.prepare(`
      SELECT * FROM tax_rates 
      WHERE region = ? AND is_active = 1 
      AND effective_date <= date('now')
      AND (end_date IS NULL OR end_date > date('now'))
      ORDER BY effective_date DESC
      LIMIT 1
    `).bind(region).first<{
      region: string;
      region_name: string;
      tax_type: string;
      rate: number;
    }>();

    if (!taxRate) {
      return c.json({
        success: true,
        amount: parsedAmount,
        tax_rate: 0,
        tax_amount: 0,
        total: parsedAmount,
        region,
        message: 'No tax rate found for this region'
      });
    }

    let baseAmount = parsedAmount;
    let taxAmount: number;
    let total: number;

    if (include_tax === 'true') {
      // Amount already includes tax, extract it
      baseAmount = parsedAmount / (1 + taxRate.rate);
      taxAmount = parsedAmount - baseAmount;
      total = parsedAmount;
    } else {
      // Calculate tax to add
      taxAmount = baseAmount * taxRate.rate;
      total = baseAmount + taxAmount;
    }

    return c.json({
      success: true,
      base_amount: Math.round(baseAmount * 100) / 100,
      tax_rate: taxRate.rate,
      tax_rate_percent: (taxRate.rate * 100).toFixed(2) + '%',
      tax_type: taxRate.tax_type,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      region: taxRate.region,
      region_name: taxRate.region_name
    });
  } catch (error) {
    console.error('Tax calculate error:', error);
    return c.json({ error: 'Failed to calculate tax' }, 500);
  }
});

// =====================================================
// GET TAX REGIONS
// =====================================================
currency.get('/tax/regions', async (c) => {
  try {
    const db = c.env.DB;
    const regions = await db.prepare(`
      SELECT DISTINCT region, region_name, tax_type, rate 
      FROM tax_rates 
      WHERE is_active = 1
      AND effective_date <= date('now')
      AND (end_date IS NULL OR end_date > date('now'))
      ORDER BY region_name
    `).all();

    // Group by country/region
    const grouped: Record<string, any[]> = {};
    for (const region of (regions.results || []) as any[]) {
      const country = region.region.split('-')[0];
      if (!grouped[country]) {
        grouped[country] = [];
      }
      grouped[country].push(region);
    }

    return c.json({
      success: true,
      regions: regions.results,
      grouped
    });
  } catch (error) {
    console.error('Get tax regions error:', error);
    return c.json({ error: 'Failed to fetch tax regions' }, 500);
  }
});

// =====================================================
// CHECK TAX EXEMPTION
// =====================================================
currency.get('/tax/exemption', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const { region } = c.req.query();

    let query = 'SELECT * FROM tax_exemptions WHERE user_id = ? AND is_active = 1';
    const params: string[] = [userId];

    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }

    const exemptions = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      exemptions: exemptions.results,
      has_exemption: (exemptions.results?.length || 0) > 0
    });
  } catch (error) {
    console.error('Check exemption error:', error);
    return c.json({ error: 'Failed to check tax exemption' }, 500);
  }
});

// =====================================================
// SUBMIT TAX EXEMPTION
// =====================================================
currency.post('/tax/exemption', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { region, exemption_type, tax_id, document_url } = body;

    if (!region || !exemption_type) {
      return c.json({ error: 'region and exemption_type are required' }, 400);
    }

    const exemptionId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO tax_exemptions (id, user_id, region, exemption_type, tax_id, document_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, region) DO UPDATE SET 
        exemption_type = ?, tax_id = ?, document_url = ?, verified = 0, updated_at = datetime('now')
    `).bind(
      exemptionId, userId, region, exemption_type, tax_id || null, document_url || null,
      exemption_type, tax_id || null, document_url || null
    ).run();

    return c.json({
      success: true,
      message: 'Tax exemption submitted for review',
      exemption_id: exemptionId
    });
  } catch (error) {
    console.error('Submit exemption error:', error);
    return c.json({ error: 'Failed to submit tax exemption' }, 500);
  }
});

// =====================================================
// GENERATE INVOICE
// =====================================================
currency.post('/invoices/generate', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { 
      amount, 
      currency: currencyCode = 'USD', 
      region,
      subscription_id,
      billing_name,
      billing_email,
      billing_address,
      billing_tax_id,
      period_start,
      period_end,
      line_items = []
    } = body;

    if (!amount) {
      return c.json({ error: 'amount is required' }, 400);
    }

    // Check for tax exemption
    const exemption = await db.prepare(`
      SELECT * FROM tax_exemptions 
      WHERE user_id = ? AND region = ? AND verified = 1 AND is_active = 1
    `).bind(userId, region || '').first();

    // Calculate tax
    let taxRate = 0;
    let taxAmount = 0;
    let taxRegion = region;

    if (region && !exemption) {
      const tax = await db.prepare(`
        SELECT rate FROM tax_rates 
        WHERE region = ? AND is_active = 1 
        AND effective_date <= date('now')
        ORDER BY effective_date DESC LIMIT 1
      `).bind(region).first<{ rate: number }>();
      
      if (tax) {
        taxRate = tax.rate;
        taxAmount = amount * taxRate;
      }
    }

    const total = amount + taxAmount;

    // Generate invoice number
    const timestamp = Date.now();
    const invoiceNumber = `INV-${timestamp}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const invoiceId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, user_id, subscription_id, amount, currency, 
        tax_region, tax_rate, tax_amount, total, status,
        billing_name, billing_email, billing_address, billing_tax_id,
        period_start, period_end, due_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, date('now', '+30 days'))
    `).bind(
      invoiceId, invoiceNumber, userId, subscription_id || null, amount, currencyCode,
      taxRegion || null, taxRate, taxAmount, total,
      billing_name || null, billing_email || null, 
      billing_address ? JSON.stringify(billing_address) : null, billing_tax_id || null,
      period_start || null, period_end || null
    ).run();

    // Insert line items
    for (const item of line_items) {
      await db.prepare(`
        INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, amount)
        VALUES (?, ?, ?, ?, ?)
      `).bind(invoiceId, item.description, item.quantity || 1, item.unit_price, item.amount).run();
    }

    // Get currency details for formatting
    const currencyDetails = await db.prepare('SELECT * FROM currencies WHERE code = ?').bind(currencyCode).first<Currency>();

    return c.json({
      success: true,
      invoice: {
        id: invoiceId,
        invoice_number: invoiceNumber,
        amount,
        currency: currencyCode,
        tax_rate: taxRate,
        tax_rate_percent: (taxRate * 100).toFixed(2) + '%',
        tax_amount: taxAmount,
        total,
        formatted_amount: currencyDetails ? formatCurrency(amount, currencyDetails) : amount.toFixed(2),
        formatted_tax: currencyDetails ? formatCurrency(taxAmount, currencyDetails) : taxAmount.toFixed(2),
        formatted_total: currencyDetails ? formatCurrency(total, currencyDetails) : total.toFixed(2),
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    return c.json({ error: 'Failed to generate invoice' }, 500);
  }
});

// =====================================================
// GET INVOICE
// =====================================================
currency.get('/invoices/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const invoiceId = c.req.param('id');

    const invoice = await db.prepare(`
      SELECT i.*, c.symbol, c.decimal_places
      FROM invoices i
      JOIN currencies c ON i.currency = c.code
      WHERE (i.id = ? OR i.invoice_number = ?) AND i.user_id = ?
    `).bind(invoiceId, invoiceId, userId).first();

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Get line items
    const lineItems = await db.prepare(`
      SELECT * FROM invoice_line_items WHERE invoice_id = ?
    `).bind(invoice.id).all();

    return c.json({
      success: true,
      invoice: {
        ...invoice,
        line_items: lineItems.results
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return c.json({ error: 'Failed to fetch invoice' }, 500);
  }
});

// =====================================================
// LIST USER INVOICES
// =====================================================
currency.get('/invoices', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const { page = '1', limit = '20', status } = c.req.query();

    let query = 'SELECT * FROM invoices WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const invoices = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?';
    const count = await db.prepare(countQuery).bind(userId).first<{ count: number }>();

    return c.json({
      success: true,
      invoices: invoices.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count?.count || 0
      }
    });
  } catch (error) {
    console.error('List invoices error:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// =====================================================
// TAX COMPLIANCE REPORT
// =====================================================
currency.get('/tax/report', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const { year = new Date().getFullYear().toString() } = c.req.query();

    // Get all paid invoices for the year
    const invoices = await db.prepare(`
      SELECT 
        tax_region,
        currency,
        SUM(amount) as total_amount,
        SUM(tax_amount) as total_tax,
        COUNT(*) as invoice_count
      FROM invoices 
      WHERE user_id = ? 
        AND status = 'paid'
        AND strftime('%Y', created_at) = ?
      GROUP BY tax_region, currency
    `).bind(userId, year).all();

    // Get total by region
    const byRegion = await db.prepare(`
      SELECT 
        tax_region,
        tr.tax_type,
        tr.region_name,
        SUM(i.tax_amount) as total_tax
      FROM invoices i
      LEFT JOIN tax_rates tr ON i.tax_region = tr.region
      WHERE i.user_id = ? 
        AND i.status = 'paid'
        AND strftime('%Y', i.created_at) = ?
      GROUP BY i.tax_region
    `).bind(userId, year).all();

    return c.json({
      success: true,
      year,
      report: {
        summary: invoices.results,
        by_region: byRegion.results,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Tax report error:', error);
    return c.json({ error: 'Failed to generate tax report' }, 500);
  }
});

export default currency;
