import { auth } from '@/lib/auth';
import { getOrgTeam } from '@/server/services/organization-service';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export default async function TeamPage() {
  const session = await auth();
  const team = await getOrgTeam(session!.user.organizationId!);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Team</p>
        <h1 className="text-3xl font-display">Team members</h1>
        <p className="mt-2 text-stone-2">People with access to {session!.user.organizationName}.</p>
      </div>

      <Card>
        {team.length === 0 ? (
          <EmptyState
            title="Just you for now"
            description="Your team will appear here as you invite members. Team invitations are coming soon."
          />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-stone-2">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b border-hairline/60 last:border-0">
                  <td className="py-3 pr-4">{member.user.fullName || '—'}</td>
                  <td className="py-3 pr-4 text-stone-2">{member.user.email}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex px-2 py-0.5 rounded-sm bg-paper-2 text-xs font-mono">
                      {member.role.slug}
                    </span>
                  </td>
                  <td className="py-3 text-stone-2">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
}
