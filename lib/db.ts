import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    let rawUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres.glnjgcwdzxqktkgyjhtp:DolaGanesa%4012@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
    const connectionString = rawUrl.replace(/[?&]sslmode=[^&]+/g, '');

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const db = getDbPool();
  const res = await db.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function initDb(): Promise<void> {
  const ddl = `
    CREATE TABLE IF NOT EXISTS dolan_archives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        subject TEXT NOT NULL DEFAULT 'Computer Science',
        doc_type TEXT NOT NULL DEFAULT 'Research Notes',
        status TEXT NOT NULL DEFAULT 'published',
        content TEXT NOT NULL,
        abstract TEXT,
        tags TEXT[] NOT NULL DEFAULT '{}',
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        word_count INT NOT NULL DEFAULT 0,
        reading_time_min INT NOT NULL DEFAULT 1,
        citations JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_archives_updated ON dolan_archives (updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_archives_subject ON dolan_archives (subject);
    CREATE INDEX IF NOT EXISTS idx_archives_pinned ON dolan_archives (is_pinned DESC, updated_at DESC);
  `;
  await query(ddl);

  // Check if we need to seed an inaugural academic archive document
  const countRes = await query<{ count: string }>('SELECT count(*) as count FROM dolan_archives');
  if (parseInt(countRes[0]?.count || '0', 10) === 0) {
    const seedSql = `
      INSERT INTO dolan_archives (
        code, title, subtitle, subject, doc_type, status, abstract, content, tags, is_pinned, word_count, reading_time_min, citations
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
    `;

    const seedContent = `# Foundations of High-Performance Neural Representation

## Abstract
This document synthesizes core formal concepts underlying multi-dimensional representation spaces, gradient descent trajectories, and computational complexity bounds.

---

## 1. Mathematical Formulation

Let $\\mathcal{X} \\subset \\mathbb{R}^d$ denote the input manifold and let $\\mathcal{H}$ represent a reproducing kernel Hilbert space with inner product $\\langle \\cdot, \\cdot \\rangle_\\mathcal{H}$.

The primal objective function under regularized empirical risk minimization is formulated as:

$$\\min_{\\theta \\in \\Theta} \\left( \\frac{1}{N} \\sum_{i=1}^{N} \\mathcal{L}\\big(f_\\theta(x_i), y_i\\big) + \\frac{\\lambda}{2} \\|\\theta\\|_2^2 \\right)$$

Where:
- $\\mathcal{L}: \\mathbb{R}^k \\times \\mathbb{R}^k \\to \\mathbb{R}_+$ denotes the cross-entropy convex surrogate loss.
- $\\lambda > 0$ denotes the Tikhonov regularization scalar.
- $\\theta \\in \\mathbb{R}^p$ represents the parameterized weight tensor.

### Theorem 1.1 (Spectral Radius Convergence)
For any learning rate $\\eta$ satisfying $0 < \\eta < \\frac{2}{\\lambda_{\\max}(\\nabla^2 \\mathcal{L})}$, the descent sequence converges exponentially:

$$\\|\\theta^{(t)} - \\theta^*\\| \\le \\left(1 - \\eta \\mu\\right)^t \\|\\theta^{(0)} - \\theta^*\\|$$

---

## 2. Algorithmic Implementation

\`\`\`python
import numpy as np

def compute_hessian_eigenvalues(loss_fn, theta, epsilon=1e-5):
    """
    Computes spectral upper bound via Power Iteration on the Hessian-vector product.
    """
    v = np.random.randn(*theta.shape)
    v /= np.linalg.norm(v)
    for _ in range(50):
        # Forward-backward finite difference
        grad_plus = loss_fn(theta + epsilon * v)
        grad_minus = loss_fn(theta - epsilon * v)
        hvp = (grad_plus - grad_minus) / (2 * epsilon)
        v = hvp / (np.linalg.norm(hvp) + 1e-12)
    return np.dot(v, hvp)
\`\`\`

---

## 3. Key Observations & Critical Notes
- **Curvature Conditioning**: Highly anisotropic loss landscapes require second-order adaptive momentum (such as AdamW with decoupled decay).
- **Overparameterization**: Modern deep networks operate in the overparameterized regime ($p \\gg N$), where classical VC-dimension bounds are vacuous; generalization relies on implicit inductive bias.

---

## 4. References & Academic Citations
1. Shannon, C. E. (1948). *A Mathematical Theory of Communication*. Bell System Technical Journal, 27(3), 379–423.
2. Bottou, L., Curtis, F. E., & Nocedal, J. (2018). *Optimization Methods for Large-Scale Machine Learning*. SIAM Review, 60(2), 223–311.
`;

    await query(seedSql, [
      'ARC-2026-001',
      'Foundations of High-Performance Neural Representation',
      'An analytical treatise on convex bounds, spectral gradients, and dimensional manifolds',
      'Computer Science',
      'Research Notes',
      'published',
      'A formal academic analysis synthesizing multi-dimensional representation spaces, empirical risk minimization bounds, and spectral radius convergence rates.',
      seedContent,
      ['#machine-learning', '#optimization', '#convex-analysis', '#spectral-theory'],
      true,
      385,
      2,
      JSON.stringify([
        { id: '1', text: 'Shannon, C. E. (1948). A Mathematical Theory of Communication. Bell System Technical Journal.' },
        { id: '2', text: 'Bottou, L. et al. (2018). Optimization Methods for Large-Scale Machine Learning. SIAM Review.' }
      ])
    ]);
  }
}
