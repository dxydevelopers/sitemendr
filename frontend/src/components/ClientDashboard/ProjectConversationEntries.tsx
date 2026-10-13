'use client';

type ConversationMessage = {
  id: string;
  projectRequestId: string;
  senderRole: string;
  message: string;
  kind?: string;
  choices?: string[] | null;
  attachments?: Array<{ label?: string; url?: string }> | null;
  eventData?: Record<string, unknown> | null;
  createdAt: string;
};

export default function ProjectConversationEntries({
  messages,
  viewerRole,
  onChoose,
  onLifecycleDecision,
  onRecordRefund,
}: {
  messages: ConversationMessage[];
  viewerRole: 'client' | 'admin';
  onChoose?: (choice: string) => void;
  onLifecycleDecision?: (messageId: string, decision: 'confirm' | 'decline' | 'resume' | 'reopen') => void;
  onRecordRefund?: (requestId: string) => void;
}) {
  return (
    <>
      {messages.map((message) => {
        if (message.kind === 'event' || message.senderRole === 'system') {
          const eventType = String(message.eventData?.type || 'project_update');
          const eventLabels: Record<string, string> = {
            quote_sent: 'Quote sent', quote_accepted: 'Quote accepted', payment_request_sent: 'Deposit requested',
            pause_requested: 'Pause requested', cancel_requested: 'Cancellation requested',
            pause_confirmed: 'Project paused', cancel_confirmed: 'Build cancelled', pause_declined: 'Pause request declined', cancel_declined: 'Cancellation request declined', pause_resumed: 'Project resumed', cancel_reopened: 'Build reopened',
            cancellation_refund_processed: 'Cancellation refund recorded',
            deposit_payment_verified: 'Deposit paid', production_started: 'Build started', milestone_updated: 'Milestone update',
            progress_update: 'Project update', preview_shared: 'Preview ready', preview_approved: 'Preview approved',
            preview_changes_requested: 'Changes requested', site_launched: 'Site launched', handoff_prepared: 'Handoff ready',
            handoff_accepted: 'Handoff accepted', handoff_issue_reported: 'Handoff issue', handoff_issue_resolved: 'Handoff issue resolved',
            final_payment_verified: 'Final payment', build_completed: 'Build complete',
          };
          const eventLabel = eventLabels[eventType] || eventType.replace(/_/g, ' ');
          const version = message.eventData?.version;
          const amount = message.eventData?.amount ?? (message.eventData?.amountMinor !== undefined ? Number(message.eventData.amountMinor) / 100 : undefined);
          const currency = message.eventData?.currency;
          const settlement = message.eventData?.cancellationSettlement as { currency?: string; chargeTotal?: number; paidTotal?: number; refundDue?: number; balanceDue?: number; refundedTotal?: number; refundStatus?: string; settlementStatus?: string; lastRefundReference?: string; completedMilestones?: Array<{ name: string; amount: number }>; incurredCosts?: Array<{ name: string; amount: number }> } | undefined;
          return (
            <div key={message.id} className="flex justify-center py-1">
              <div className="w-full max-w-md border border-white/10 bg-white/[0.035] px-4 py-3 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-ai-blue">{eventLabel}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/78">{message.message}</p>
                {Boolean(message.eventData?.lifecycleStatus) && <p className="mt-1 text-[10px] font-semibold capitalize text-amber-300/75">Admin decision: {String(message.eventData?.lifecycleStatus)}</p>}
                {settlement && (
                  <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-left text-[10px] text-white/60">
                    {settlement.completedMilestones?.map(item => <p key={`milestone-${item.name}`}>Completed: {item.name} · {settlement.currency} {item.amount}</p>)}
                    {settlement.incurredCosts?.map(item => <p key={`cost-${item.name}`}>Cost incurred: {item.name} · {settlement.currency} {item.amount}</p>)}
                    <p className="pt-1 font-semibold text-white/80">Charges {settlement.currency} {settlement.chargeTotal} · Paid {settlement.currency} {settlement.paidTotal}</p>
                    {settlement.settlementStatus === 'reversed' && <p className="font-semibold text-ai-blue">Previous cancellation calculation voided when the build reopened. No refund was processed.</p>}
                    {settlement.settlementStatus !== 'reversed' && Number(settlement.refundDue) > 0 && <p className={`font-semibold ${settlement.refundStatus === 'processed' ? 'text-expert-green' : 'text-amber-300'}`}>{settlement.refundStatus === 'processed' ? 'Refund processed' : `${settlement.refundStatus === 'partial' ? 'Refund remaining' : 'Refund due'} ${settlement.currency} ${Math.max(Number(settlement.refundDue) - Number(settlement.refundedTotal || 0), 0)}`}</p>}
                    {settlement.settlementStatus !== 'reversed' && Number(settlement.refundedTotal) > 0 && <p>Refunded so far: {settlement.currency} {settlement.refundedTotal}{settlement.lastRefundReference ? ` · ${String(settlement.lastRefundReference)}` : ''}</p>}
                    {Number(settlement.balanceDue) > 0 && <p className="font-semibold text-amber-300">Remaining balance {settlement.currency} {settlement.balanceDue}</p>}
                  </div>
                )}
                {viewerRole === 'admin' && eventType === 'cancel_confirmed' && settlement && ['pending', 'partial'].includes(String(settlement.refundStatus)) && Number(settlement.refundDue) > Number(settlement.refundedTotal || 0) && onRecordRefund && (
                  <button type="button" onClick={() => onRecordRefund(message.projectRequestId)} className="mt-3 border border-amber-300/25 px-3 py-2 text-[10px] font-semibold text-amber-300 hover:bg-amber-300/10">Record processed refund</button>
                )}
                {(version || amount !== undefined) && (
                  <p className="mt-1 text-[10px] text-white/46">
                    {version ? `Version ${String(version)}` : ''}{version && amount !== undefined ? ' · ' : ''}
                    {amount !== undefined ? `${currency ? `${String(currency)} ` : ''}${String(amount)}` : ''}
                  </p>
                )}
                <time className="mt-2 block text-[9px] text-white/35">{new Date(message.createdAt).toLocaleString()}</time>
                {viewerRole === 'admin' && message.eventData?.lifecycleStatus === 'pending' && onLifecycleDecision && (
                  <div className="mt-3 flex justify-center gap-2">
                    <button type="button" onClick={() => onLifecycleDecision(message.id, 'confirm')} className="border border-ai-blue/30 px-3 py-2 text-[10px] font-semibold text-ai-blue hover:bg-ai-blue/10">Confirm request</button>
                    <button type="button" onClick={() => onLifecycleDecision(message.id, 'decline')} className="border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/55 hover:bg-white/10">Decline</button>
                  </div>
                )}
  {viewerRole === 'admin' && message.eventData?.lifecycleType === 'pause' && message.eventData?.lifecycleStatus === 'confirmed' && onLifecycleDecision && (
                  <button type="button" onClick={() => onLifecycleDecision(message.id, 'resume')} className="mt-3 border border-expert-green/30 px-3 py-2 text-[10px] font-semibold text-expert-green hover:bg-expert-green/10">Resume at previous stage</button>
                )}
                {viewerRole === 'admin' && message.eventData?.lifecycleType === 'cancel' && message.eventData?.lifecycleStatus === 'confirmed' && Number(settlement?.refundedTotal || 0) === 0 && onLifecycleDecision && (
                  <button type="button" onClick={() => onLifecycleDecision(message.id, 'reopen')} className="mt-3 border border-ai-blue/30 px-3 py-2 text-[10px] font-semibold text-ai-blue hover:bg-ai-blue/10">Reopen at previous stage</button>
                )}
              </div>
            </div>
          );
        }

        const mine = message.senderRole === viewerRole;
        const sender = mine ? (viewerRole === 'client' ? 'You' : 'You') : (viewerRole === 'client' ? 'Team' : 'Client');
        return (
          <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] ${mine ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block rounded-2xl px-4 py-3 text-left text-sm font-semibold leading-6 ${mine ? 'rounded-tr-sm bg-ai-blue text-white' : 'rounded-tl-sm border border-white/10 bg-white/[0.06] text-white/78'}`}>
                {message.message && <p className="whitespace-pre-line">{message.message}</p>}
                {message.attachments?.map((attachment, index) => attachment.url ? (
                  <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="mt-2 block underline">{attachment.label || attachment.url}</a>
                ) : null)}
                <p className={`mt-1 text-[9px] font-semibold ${mine ? 'text-white/65' : 'text-white/35'}`}>{sender} · {new Date(message.createdAt).toLocaleString()}</p>
              </div>
              {message.choices?.length ? (
                <div className={`mt-2 flex flex-wrap gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {message.choices.map((choice) => onChoose && !mine ? (
                    <button key={choice} type="button" onClick={() => onChoose(choice)} className="rounded-full border border-ai-blue/25 px-3 py-1.5 text-[10px] font-semibold text-ai-blue transition hover:bg-ai-blue/10 hover:text-white">{choice}</button>
                  ) : <span key={choice} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-semibold text-white/48">{choice}</span>)}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
