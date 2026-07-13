import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacherSession } from "@/lib/auth-guard";
import { getStudentIfManageable } from "@/lib/class-auth";
import { getSessionFromCookies } from "@/lib/auth";
import { StudentForm } from "@/components/student-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EditarAlunoPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireTeacherSession();
  const session = await getSessionFromCookies();
  if (!session) notFound();

  const { studentId } = await params;
  const student = await getStudentIfManageable(session, studentId);
  if (!student) notFound();

  return (
    <article className="space-y-6 max-w-2xl">
      <header>
        <Link
          href={`/professor/aluno/${studentId}`}
          className="text-sm text-primary hover:underline"
        >
          ← {student.user.name}
        </Link>
        <h1 className="text-2xl font-bold mt-1">Editar aluno</h1>
        <p className="text-sm text-muted">{student.class.name}</p>
      </header>
      <Card>
        <StudentForm
          initial={{
            id: student.id,
            name: student.user.name,
            email: student.user.email,
          }}
        />
      </Card>
    </article>
  );
}
