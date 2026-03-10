import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Discipline {
  code: string;
  name: string;
  type: string;
}

const disciplines: Discipline[] = [
  { code: 'EAD01077', name: 'Introdução à Informática', type: 'Obrigatória' },
  { code: 'EAD17001', name: 'Teoria da Contabilidade I', type: 'Obrigatória' },
  { code: 'EAD17002', name: 'Contabilidade I', type: 'Obrigatória' },
  { code: 'EAD17003', name: 'Matemática aplicada à Contabilidade I', type: 'Obrigatória' },
  { code: 'EAD17004', name: 'Contabilidade II', type: 'Obrigatória' },
  { code: 'EAD17005', name: 'Matemática aplicada à Contabilidade II', type: 'Obrigatória' },
  { code: 'EAD17006', name: 'Métodos e Técnicas de Pesquisa em Contabilidade', type: 'Obrigatória' },
  { code: 'EAD17007', name: 'Matemática Financeira', type: 'Obrigatória' },
  { code: 'EAD17008', name: 'Contabilidade Intermediária', type: 'Obrigatória' },
  { code: 'EAD17009', name: 'Contabilidade de Custos', type: 'Obrigatória' },
  { code: 'EAD17011', name: 'Economia I', type: 'Obrigatória' },
  { code: 'EAD17012', name: 'Introdução à Administração e Comportamento Organizacional', type: 'Obrigatória' },
  { code: 'EAD17013', name: 'Contabilidade Gerencial', type: 'Obrigatória' },
  { code: 'EAD17014', name: 'Instituições de Direito aplicada à Contabilidade', type: 'Obrigatória' },
  { code: 'EAD17015', name: 'Economia II', type: 'Obrigatória' },
  { code: 'EAD17016', name: 'Contabilidade Avançada I', type: 'Obrigatória' },
  { code: 'EAD17017', name: 'Contabilidade Avançada II', type: 'Obrigatória' },
  { code: 'EAD17018', name: 'Legislação Tributária', type: 'Obrigatória' },
  { code: 'EAD17019', name: 'Métodos Quantitativos I', type: 'Obrigatória' },
  { code: 'EAD17020', name: 'Estágio Supervisionado', type: 'Obrigatória' },
  { code: 'EAD17021', name: 'Legislação Empresarial', type: 'Obrigatória' },
  { code: 'EAD17022', name: 'Orçamento e Planejamento Empresarial', type: 'Obrigatória' },
  { code: 'EAD17023', name: 'Métodos Quantitativos II', type: 'Obrigatória' },
  { code: 'EAD17024', name: 'Legislação Social e Trabalhista', type: 'Obrigatória' },
  { code: 'EAD17025', name: 'Contabilidade Tributária', type: 'Obrigatória' },
  { code: 'EAD17027', name: 'Controladoria', type: 'Obrigatória' },
  { code: 'EAD17028', name: 'Análise Econômico-financeira', type: 'Obrigatória' },
  { code: 'EAD17032', name: 'Orçamento e Planejamento Governamental', type: 'Obrigatória' },
  { code: 'EAD17035', name: 'Projeto de Pesquisa em Contabilidade', type: 'Obrigatória' },
  { code: 'EAD17033', name: 'Administração Financeira I', type: 'Obrigatória' },
  { code: 'EAD17034', name: 'Auditoria', type: 'Obrigatória' },
  { code: 'EAD17037', name: 'Contabilidade Governamental', type: 'Obrigatória' },
  { code: 'EAD17038', name: 'Monografia', type: 'Obrigatória' },
  { code: 'EAD17041', name: 'Ética Profissional', type: 'Obrigatória' },
  { code: 'EAD17042', name: 'Perícia Contábil', type: 'Obrigatória' },
  { code: 'EAD00031', name: 'Libras', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD11019', name: 'Teoria das Finanças Públicas', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11026', name: 'Gestão de Pessoas no Setor Público', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11036', name: 'Auditoria e Controladoria', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11037', name: 'Negociação e Arbitragem', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11061', name: 'Empreendedorismo Governamental', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11062', name: 'Licitação, Contratos e Convênios', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11063', name: 'Gestão da Qualidade no Setor Público', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11082', name: 'Planejamento Governamental', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11085', name: 'Gestão de Projetos Públicos', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11088', name: 'Políticas Públicas', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11092', name: 'Inovação na Administração Pública', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11093', name: 'Regulação de Serviços Públicos', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11098', name: 'Direito e Legislação Tributária', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11099', name: 'Marketing e Sociedade', type: 'Optativas de Livre Escolha' },
  { code: 'EAD11100', name: 'Redação Oficial', type: 'Optativas de Livre Escolha' },
  { code: 'EAD17029', name: 'Teoria da Contabilidade II', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17030', name: 'Mercado Financeiro', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17031', name: 'Contabilidade Trabalhista', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17039', name: 'Administração Financeira II', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17043', name: 'Avaliação de Empresas', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17044', name: 'Gestão de Riscos', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17045', name: 'Simulação Empresarial', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17046', name: 'Gestão, Tecnologia e Inovação I', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17047', name: 'Análise de Investimentos', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17048', name: 'Mercado Mobiliário', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17049', name: 'Auditoria e Contabilidade Governamental', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17050', name: 'Análise Balanços Governamental', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17051', name: 'Contabilidade Socioambiental', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17052', name: 'Aspectos Contábeis das Empresas Seguradoras', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17053', name: 'Aspectos Contábeis das Instituições Financeira', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17054', name: 'Fundamentos de Atuária', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17055', name: 'Filosofia das Organizações', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17056', name: 'Marketing', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17057', name: 'Gestão de Projetos', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17058', name: 'Combinação de Negócios', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17059', name: 'Contabilidade Governamental Avançada', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17060', name: 'Gestão de Planejamento Tributário', type: 'Optativa de Escolha Condicionada' },
  { code: 'EAD17061', name: 'Finanças Pessoais', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17062', name: 'Gestão, Desenvolvimento e Inovação I', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17063', name: 'Gestão, Desenvolvimento e Inovação II', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17010', name: 'Requisitos Curriculares Suplementares (RCS) Extensão', type: 'Atividade de Extensão - Disciplina' },
  { code: 'EAD17040', name: 'Atividades Científicos Cultural', type: 'Atividades Acadêmicas Complementares (Disciplina)' },
];

const subfolderNames = ['AD1', 'AD2', 'AP1', 'AP2', 'AP3'];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    console.log(`Creating ${disciplines.length} courses and subfolders...`);

    let createdCount = 0;

    for (const discipline of disciplines) {
      const courseName = `${discipline.code} - ${discipline.name}`;

      // Create course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({ name: courseName })
        .select()
        .single();

      if (courseError) {
        console.error(`Error creating course ${courseName}:`, courseError);
        continue;
      }

      if (!courseData) {
        console.error(`No data returned for course ${courseName}`);
        continue;
      }

      // Create subfolders for this course
      const folderInserts = subfolderNames.map((folderName) => ({
        course_id: courseData.id,
        parent_folder_id: null,
        name: folderName,
      }));

      const { error: foldersError } = await supabase
        .from('folders')
        .insert(folderInserts);

      if (foldersError) {
        console.error(`Error creating folders for ${courseName}:`, foldersError);
      } else {
        createdCount++;
        console.log(`✓ Created course and folders: ${courseName}`);
      }
    }

    console.log(`\n✅ Seeding completed! Created ${createdCount} courses with subfolders.`);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
