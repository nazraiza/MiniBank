import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function CustomerTransfer() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ senderAccountId: '', recipientAccountNumber: '', amount: '', note: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/accounts/my').then(r => {
      const active = r.data.accounts.filter(a => a.status === 'active');
      setAccounts(active);
      if (active.length) setForm(f => ({ ...f, senderAccountId: active[0]._id }));
    });
  }, []);

  const selectedAccount = accounts.find(a => a._id === form.senderAccountId);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' }); setResult(null); setLoading(true);
    try {
      const res = await api.post('/transactions/transfer', {
        senderAccountId: form.senderAccountId,
        recipientAccountNumber: form.recipientAccountNumber,
        amount: Number(form.amount),
        note: form.note,
      });
      setResult(res.data);
      setMsg({ type: 'success', text: `Transfer of ${fmtBDT(form.amount)} was successful!` });
      setForm(f => ({ ...f, recipientAccountNumber: '', amount: '', note: '' }));
      // Refresh accounts
      const accRes = await api.get('/accounts/my');
      setAccounts(accRes.data.accounts.filter(a => a.status === 'active'));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Transfer failed' });
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Transfer Funds" subtitle="Send money to another MiniBank account instantly">
      <div style={{ maxWidth: 580 }}>
        {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

        {result && (
          <div className="card" style={{ borderLeft: '4px solid #16a34a', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: 8 }}>✅ Transfer Successful</div>
            <div style={{ fontSize: '.88rem', color: '#555' }}>
              <div><strong>Transaction Ref:</strong> <code>{result.transaction?.transactionRef}</code></div>
              <div><strong>New Balance:</strong> {fmtBDT(result.newBalance)}</div>
              <div><strong>Recipient Account:</strong> {result.recipient?.accountNumber}</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>💸 New Transfer</div>

          {accounts.length === 0 ? (
            <div className="alert alert-info">You need an active account to make transfers.</div>
          ) : (
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>From Account *</label>
                <select className="form-control" value={form.senderAccountId}
                  onChange={e => setForm({ ...form, senderAccountId: e.target.value })}>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.accountNumber} — {a.type} — Balance: {fmtBDT(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccount && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 6, marginBottom: 16, fontSize: '.85rem' }}>
                  Available Balance: <strong style={{ color: '#16a34a' }}>{fmtBDT(selectedAccount.balance)}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Recipient Account Number *</label>
                <input className="form-control" placeholder="e.g. MB123456789"
                  value={form.recipientAccountNumber}
                  onChange={e => setForm({ ...form, recipientAccountNumber: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Amount (BDT) *</label>
                <input className="form-control" type="number" min="1" placeholder="Enter amount to transfer"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                {form.amount && selectedAccount && Number(form.amount) > selectedAccount.balance && (
                  <div style={{ color: '#dc2626', fontSize: '.8rem', marginTop: 4 }}>⚠ Insufficient balance</div>
                )}
              </div>

              <div className="form-group">
                <label>Note (Optional)</label>
                <input className="form-control" placeholder="e.g. Rent payment, Tuition fee"
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>

              <div style={{ padding: 12, background: '#fefce8', borderRadius: 6, fontSize: '.82rem', color: '#854d0e', marginBottom: 16 }}>
                ⚠️ Transfers are instant and <strong>irreversible</strong>. Please verify the recipient account number before confirming.
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                type="submit" disabled={loading || !form.amount || !form.recipientAccountNumber}>
                {loading ? '⏳ Processing...' : '💸 Confirm Transfer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
