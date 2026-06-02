import { UserRole } from "@prisma/client";
import { generateUniqueClassCode } from "@/lib/access-code";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth-validators";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INDIVIDUAL_SCHOOL_NAME = "Contas individuais";

export type RegisterInput = {
  role: "STUDENT" | "TEACHER";
  name: string;
  email: string;
  password: string;
  classCode?: string;
  schoolName?: string;
  className?: string;
};

export type RegisterResult = {
  userId: string;
  role: UserRole;
  name: string;
  classCode?: string;
  className?: string;
};

export function validateRegisterInput(input: RegisterInput): string | null {
  if (input.role !== "STUDENT" && input.role !== "TEACHER") {
    return "Tipo de conta inválido";
  }
  return (
    validateName(input.name) ??
    validateEmail(input.email) ??
    validatePassword(input.password)
  );
}

async function getOrCreateIndividualSchool() {
  const existing = await prisma.school.findFirst({
    where: { name: INDIVIDUAL_SCHOOL_NAME },
  });
  if (existing) return existing;

  return prisma.school.create({
    data: { name: INDIVIDUAL_SCHOOL_NAME },
  });
}

async function registerStudent(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const passwordHash = await hashPassword(input.password);

  if (input.classCode?.trim()) {
    const code = input.classCode.trim().toUpperCase();
    const turma = await prisma.class.findFirst({
      where: { accessCode: code },
    });
    if (!turma) {
      throw new Error("Código da turma inválido");
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: UserRole.STUDENT,
        student: { create: { classId: turma.id } },
      },
    });

    return {
      userId: user.id,
      role: UserRole.STUDENT,
      name: user.name,
      classCode: code,
      className: turma.name,
    };
  }

  const school = await getOrCreateIndividualSchool();
  const accessCode = await generateUniqueClassCode();
  const className = `Leitura — ${name.split(" ")[0]}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: UserRole.STUDENT,
      student: {
        create: {
          class: {
            create: {
              name: className,
              schoolId: school.id,
              accessCode,
            },
          },
        },
      },
    },
  });

  return {
    userId: user.id,
    role: UserRole.STUDENT,
    name: user.name,
    classCode: accessCode,
    className,
  };
}

async function registerTeacher(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const passwordHash = await hashPassword(input.password);
  const schoolName = input.schoolName?.trim() || `Escola de ${name.split(" ")[0]}`;
  const turmaName = input.className?.trim() || "Minha turma";
  const accessCode = await generateUniqueClassCode();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: UserRole.TEACHER,
      teacher: {
        create: {
          classes: {
            create: {
              name: turmaName,
              school: { create: { name: schoolName } },
              accessCode,
            },
          },
        },
      },
    },
    include: {
      teacher: { include: { classes: true } },
    },
  });

  const turma = user.teacher?.classes[0];

  return {
    userId: user.id,
    role: UserRole.TEACHER,
    name: user.name,
    classCode: turma?.accessCode ?? accessCode,
    className: turma?.name ?? turmaName,
  };
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const validationError = validateRegisterInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Este e-mail já está cadastrado");
  }

  if (input.role === "STUDENT") {
    return registerStudent(input);
  }
  return registerTeacher(input);
}
