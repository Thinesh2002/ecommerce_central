const pool = require("../../config/db");

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

class KeywordResearchModel {
  static async saveRun({ userId, keyword, market, days, summary, competitors, terms }) {
    try {
      const [result] = await pool.query(
        `INSERT INTO ebay_keyword_research_runs
          (user_id, keyword, market, days_window, summary_json, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId || null, keyword, market, Number(days) || 30, JSON.stringify(summary || {})]
      );

      const runId = result.insertId;

      if (Array.isArray(competitors) && competitors.length) {
        const values = competitors.map((c) => [
          runId,
          c.seller || null,
          c.title || null,
          c.itemId || null,
          c.itemUrl || null,
          Number(c.price) || 0,
          c.currency || null,
          c.condition || null,
          Number(c.feedbackScore) || 0,
          Number(c.watchers) || 0,
          Number(c.bids) || 0,
          Number(c.estimatedSales) || 0,
          Number(c.salesVelocity) || 0,
          c.image || null,
          JSON.stringify(c.raw || c),
        ]);
        await pool.query(
          `INSERT INTO ebay_keyword_competitors
            (run_id, seller, title, item_id, item_url, price, currency, item_condition, feedback_score,
             watchers, bids, estimated_sales, sales_velocity, image_url, raw_json)
           VALUES ?`,
          [values]
        );
      }

      if (Array.isArray(terms) && terms.length) {
        await this.saveTerms(runId, terms);
      }

      return runId;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[KEYWORD_HISTORY_SAVE_SKIPPED]", error.message);
      }
      return null;
    }
  }

  static async saveTerms(runId, terms = []) {
    try {
      const values = terms.map((t) => [
        runId,
        t.keyword || "",
        t.type || null,
        Number(t.frequency) || 0,
        Number(t.demand) || 0,
        Number(t.estimatedSearchVolume) || 0,
        Number(t.estimatedMonthlySales) || 0,
        Number(t.estimatedRevenue) || 0,
        Number(t.avgPrice) || 0,
        Number(t.competitorCount) || 0,
        Number(t.difficulty) || 0,
        Number(t.opportunityScore) || 0,
        Number(t.organicRank) || 0,
        Number(t.ppcRank) || 0,
        Number(t.suggestedBid) || 0,
        t.ctr || null,
        t.cvr || null,
        t.trend || null,
        JSON.stringify(t),
      ]);

      if (!values.length) return;
      await pool.query(
        `INSERT INTO ebay_keyword_terms
          (run_id, keyword, term_type, frequency, demand, estimated_search_volume, estimated_monthly_sales,
           estimated_revenue, avg_price, competitor_count, difficulty, opportunity_score, organic_rank,
           ppc_rank, suggested_bid, ctr, cvr, trend, raw_json)
         VALUES ?`,
        [values]
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[KEYWORD_TERMS_SAVE_SKIPPED]", error.message);
      }
    }
  }

  static async getRuns({ keyword, market, days = 30, limit = 20 }) {
    try {
      const [rows] = await pool.query(
        `SELECT run_id, user_id, keyword, market, days_window, summary_json, created_at
         FROM ebay_keyword_research_runs
         WHERE keyword = ? AND market = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY created_at DESC
         LIMIT ?`,
        [keyword, market, Number(days) || 30, Number(limit) || 20]
      );
      return rows.map((row) => ({
        ...row,
        summary: safeJsonParse(row.summary_json, {}),
      }));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[KEYWORD_HISTORY_READ_SKIPPED]", error.message);
      }
      return [];
    }
  }

  static async getLatestRuns({ limit = 20 }) {
    try {
      const [rows] = await pool.query(
        `SELECT run_id, user_id, keyword, market, days_window, summary_json, created_at
         FROM ebay_keyword_research_runs
         ORDER BY created_at DESC
         LIMIT ?`,
        [Number(limit) || 20]
      );
      return rows.map((row) => ({ ...row, summary: safeJsonParse(row.summary_json, {}) }));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[KEYWORD_LATEST_READ_SKIPPED]", error.message);
      }
      return [];
    }
  }

  static async getRunWithDetails(runId) {
    try {
      const [[run]] = await pool.query(
        `SELECT run_id, user_id, keyword, market, days_window, summary_json, created_at
         FROM ebay_keyword_research_runs
         WHERE run_id = ?
         LIMIT 1`,
        [runId]
      );
      if (!run) return null;

      const [competitors] = await pool.query(
        `SELECT competitor_id, run_id, seller, title, item_id AS itemId, item_url AS itemUrl, price, currency,
                item_condition AS itemCondition, feedback_score AS feedbackScore, watchers, bids,
                estimated_sales AS estimatedSales, sales_velocity AS salesVelocity, image_url AS imageUrl,
                raw_json AS rawJson, created_at
         FROM ebay_keyword_competitors
         WHERE run_id = ?
         ORDER BY estimated_sales DESC, watchers DESC, bids DESC`,
        [runId]
      );

      let terms = [];
      try {
        const [termRows] = await pool.query(
          `SELECT term_id, run_id, keyword, term_type AS type, frequency, demand,
                  estimated_search_volume AS estimatedSearchVolume,
                  estimated_monthly_sales AS estimatedMonthlySales,
                  estimated_revenue AS estimatedRevenue,
                  avg_price AS avgPrice, competitor_count AS competitorCount,
                  difficulty, opportunity_score AS opportunityScore,
                  organic_rank AS organicRank, ppc_rank AS ppcRank,
                  suggested_bid AS suggestedBid, ctr, cvr, trend, raw_json AS rawJson, created_at
           FROM ebay_keyword_terms
           WHERE run_id = ?
           ORDER BY opportunity_score DESC, estimated_search_volume DESC`,
          [runId]
        );
        terms = termRows.map((row) => ({ ...row, raw: safeJsonParse(row.rawJson, {}) }));
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[KEYWORD_TERMS_READ_SKIPPED]", error.message);
        }
      }

      return {
        ...run,
        summary: safeJsonParse(run.summary_json, {}),
        competitors: competitors.map((row) => ({ ...row, raw: safeJsonParse(row.rawJson, {}) })),
        terms,
      };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[KEYWORD_RUN_READ_SKIPPED]", error.message);
      }
      return null;
    }
  }

  static async getCompetitorHistory({ seller, keyword, market, days = 30 }) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, r.keyword, r.market, r.created_at
         FROM ebay_keyword_competitors c
         INNER JOIN ebay_keyword_research_runs r ON r.run_id = c.run_id
         WHERE c.seller = ? AND r.keyword = ? AND r.market = ?
           AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY r.created_at DESC`,
        [seller, keyword, market, Number(days) || 30]
      );
      return rows;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[COMPETITOR_HISTORY_READ_SKIPPED]", error.message);
      }
      return [];
    }
  }
}

module.exports = KeywordResearchModel;
