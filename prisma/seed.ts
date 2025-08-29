import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      hashedPassword,
      pgyLevel: 2,
      targetScore: 200,
      institution: 'Test Hospital',
      specialty: 'Adult Psychiatry',
    },
  });

  // Create some sample questions
  const questions = [
    {
      text: 'A 45-year-old patient presents with persistent sad mood, anhedonia, and feelings of worthlessness for the past 3 weeks. The patient also reports difficulty concentrating and decreased appetite. What is the most likely diagnosis?',
      options: [
        { label: 'A', text: 'Major Depressive Disorder' },
        { label: 'B', text: 'Dysthymic Disorder' },
        { label: 'C', text: 'Adjustment Disorder with Depressed Mood' },
        { label: 'D', text: 'Bipolar Disorder, Current Episode Depressed' },
        { label: 'E', text: 'Substance-Induced Mood Disorder' },
      ],
      correctAnswers: ['A'],
      explanation: 'This patient meets criteria for Major Depressive Disorder with symptoms lasting 3 weeks and including depressed mood, anhedonia, worthlessness, concentration difficulties, and appetite changes. These are core symptoms of MDD.',
      category: 'Adult Psychiatry',
      examPart: 'Part 1' as const,
      difficulty: 'medium' as const,
      topics: ['Depression', 'DSM-5', 'Mood Disorders'],
      examYear: 2023,
      questionNumber: 1,
      isPublic: true,
    },
    {
      text: 'Which medication is considered first-line treatment for panic disorder?',
      options: [
        { label: 'A', text: 'Alprazolam' },
        { label: 'B', text: 'Sertraline' },
        { label: 'C', text: 'Buspirone' },
        { label: 'D', text: 'Propranolol' },
        { label: 'E', text: 'Clonazepam' },
      ],
      correctAnswers: ['B'],
      explanation: 'SSRIs like sertraline are considered first-line treatment for panic disorder due to their efficacy and safety profile. While benzodiazepines can be effective short-term, they carry risk of dependence.',
      category: 'Adult Psychiatry',
      examPart: 'Part 1' as const,
      difficulty: 'easy' as const,
      topics: ['Anxiety Disorders', 'Pharmacology', 'Treatment'],
      examYear: 2023,
      questionNumber: 2,
      isPublic: true,
    },
    {
      text: 'A 7-year-old child has difficulty paying attention in class, frequently interrupts others, and has trouble sitting still. These symptoms have been present for 8 months and occur both at home and school. What is the most appropriate initial intervention?',
      options: [
        { label: 'A', text: 'Start methylphenidate immediately' },
        { label: 'B', text: 'Behavioral therapy first' },
        { label: 'C', text: 'Family therapy' },
        { label: 'D', text: 'Comprehensive psychological evaluation' },
        { label: 'E', text: 'School accommodations only' },
      ],
      correctAnswers: ['D'],
      explanation: 'Before any treatment, a comprehensive evaluation is needed to confirm ADHD diagnosis and rule out other conditions. This includes detailed history, rating scales, and assessment of functional impairment.',
      category: 'Child Psychiatry',
      examPart: 'Part 1' as const,
      difficulty: 'medium' as const,
      topics: ['ADHD', 'Assessment', 'Pediatric'],
      examYear: 2023,
      questionNumber: 3,
      isPublic: true,
    },
    {
      text: 'What is the mechanism of action of lithium in treating bipolar disorder?',
      options: [
        { label: 'A', text: 'Dopamine receptor antagonism' },
        { label: 'B', text: 'Sodium channel blockade' },
        { label: 'C', text: 'Inhibition of inositol monophosphatase' },
        { label: 'D', text: 'GABA receptor agonism' },
        { label: 'E', text: 'Serotonin reuptake inhibition' },
      ],
      correctAnswers: ['C'],
      explanation: 'Lithium inhibits inositol monophosphatase, disrupting the phosphoinositide second messenger system. This affects multiple neurotransmitter pathways and is thought to contribute to its mood-stabilizing effects.',
      category: 'Adult Psychiatry',
      examPart: 'Part 2' as const,
      difficulty: 'hard' as const,
      topics: ['Pharmacology', 'Bipolar Disorder', 'Mechanism of Action'],
      examYear: 2023,
      questionNumber: 4,
      isPublic: true,
    },
    {
      text: 'A patient with schizophrenia develops muscle rigidity, hyperthermia, and elevated creatine kinase after starting haloperidol. What is the most appropriate immediate treatment?',
      options: [
        { label: 'A', text: 'Continue haloperidol and add benztropine' },
        { label: 'B', text: 'Discontinue haloperidol and give dantrolene' },
        { label: 'C', text: 'Reduce haloperidol dose by 50%' },
        { label: 'D', text: 'Switch to risperidone' },
        { label: 'E', text: 'Add propranolol' },
      ],
      correctAnswers: ['B'],
      explanation: 'This presents as neuroleptic malignant syndrome (NMS). Immediate discontinuation of the antipsychotic and supportive care including dantrolene (muscle relaxant) and bromocriptine (dopamine agonist) are indicated.',
      category: 'Adult Psychiatry',
      examPart: 'Part 1' as const,
      difficulty: 'hard' as const,
      topics: ['Antipsychotics', 'Side Effects', 'Emergency'],
      examYear: 2023,
      questionNumber: 5,
      isPublic: true,
    },
    // Add some private questions for the user to test upload -> study flow
    {
      text: 'A patient reports seeing things that others cannot see and hearing voices commenting on their actions. These symptoms have been present for 4 months. What is the most likely diagnosis?',
      options: [
        { label: 'A', text: 'Brief Psychotic Disorder' },
        { label: 'B', text: 'Schizophreniform Disorder' },
        { label: 'C', text: 'Schizophrenia' },
        { label: 'D', text: 'Substance-Induced Psychotic Disorder' },
        { label: 'E', text: 'Delusional Disorder' },
      ],
      correctAnswers: ['B'],
      explanation: 'Schizophreniform Disorder is diagnosed when psychotic symptoms last between 1-6 months. This falls between Brief Psychotic Disorder (<1 month) and Schizophrenia (>6 months).',
      category: 'Adult Psychiatry',
      examPart: 'Part 1' as const,
      difficulty: 'medium' as const,
      topics: ['Psychotic Disorders', 'DSM-5', 'Diagnosis'],
      examYear: 2024,
      questionNumber: 6,
      isPublic: false, // Private user question
    },
    {
      text: 'Which therapeutic approach is most effective for treating Borderline Personality Disorder?',
      options: [
        { label: 'A', text: 'Cognitive Behavioral Therapy' },
        { label: 'B', text: 'Dialectical Behavior Therapy' },
        { label: 'C', text: 'Psychodynamic Therapy' },
        { label: 'D', text: 'Supportive Therapy' },
        { label: 'E', text: 'Interpersonal Therapy' },
      ],
      correctAnswers: ['B'],
      explanation: 'Dialectical Behavior Therapy (DBT) was specifically developed by Marsha Linehan for BPD and has the strongest evidence base for treating this condition.',
      category: 'Adult Psychiatry',
      examPart: 'Part 2' as const,
      difficulty: 'easy' as const,
      topics: ['Personality Disorders', 'Psychotherapy', 'Evidence-Based Treatment'],
      examYear: 2024,
      questionNumber: 7,
      isPublic: false, // Private user question
    },
    // Add a question without explanation to test AI generation
    {
      text: 'A 28-year-old patient presents with a 6-month history of persistent delusions of grandeur, auditory hallucinations, and disorganized speech. The patient has no history of substance use or medical illness. What is the most likely diagnosis?',
      options: [
        { label: 'A', text: 'Brief Psychotic Disorder' },
        { label: 'B', text: 'Schizophreniform Disorder' },
        { label: 'C', text: 'Schizophrenia' },
        { label: 'D', text: 'Schizoaffective Disorder' },
        { label: 'E', text: 'Delusional Disorder' },
      ],
      correctAnswers: ['C'],
      // No explanation - this will trigger the AI generator
      category: 'Adult Psychiatry',
      examPart: 'Part 1' as const,
      difficulty: 'medium' as const,
      topics: ['Psychotic Disorders', 'Schizophrenia', 'DSM-5'],
      examYear: 2024,
      questionNumber: 8,
      isPublic: true,
    },
  ];

  for (const questionData of questions) {
    // Check if question already exists
    const existing = await prisma.question.findFirst({
      where: {
        examYear: questionData.examYear,
        questionNumber: questionData.questionNumber,
        createdById: testUser.id,
      },
    });

    if (!existing) {
      await prisma.question.create({
        data: {
          ...questionData,
          createdById: testUser.id,
          uploadMethod: 'manual',
        },
      });
    }
  }

  console.log('✅ Seed data created successfully!');
  console.log(`👤 Test user: test@example.com / password123`);
  console.log(`📚 Created ${questions.length} sample questions (${questions.filter(q => q.isPublic).length} public, ${questions.filter(q => !q.isPublic).length} private)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });