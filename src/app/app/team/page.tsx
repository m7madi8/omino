import { auth } from '@/lib/auth';
import { getOrgTeam } from '@/server/services/organization-service';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/app/dashboard/page-header';

export default async function TeamPage() {
  const session = await auth();
  const team = await getOrgTeam(session!.user.organizationId!);

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Team members"
        description={`People with access to ${session!.user.organizationName}.`}
      />

      {team.length === 0 ? (
        <EmptyState
          title="Just you for now"
          description="Your team will appear here as you invite members. Team invitations are coming soon."
        />
      ) : (
        <>
          <Card className="hidden md:block">
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
          </Card>

          <div className="md:hidden space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="rounded-md border border-hairline bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{member.user.fullName || '—'}</p>
                    <p className="text-sm text-stone-2 truncate mt-0.5">{member.user.email}</p>
                  </div>
                  <span className="shrink-0 inline-flex px-2 py-0.5 rounded-sm bg-paper-2 text-[10px] font-mono uppercase">
                    {member.role.slug}
                  </span>
                </div>
                <p className="text-xs text-stone-2 mt-3">
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
