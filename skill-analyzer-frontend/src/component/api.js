const BASE_URL = 'http://localhost:8080';

export const LEVEL_WEIGHTS = {
  'Basic':        0.4,
  'Intermediate': 0.7,
  'Expert':       1.0,
};

export const LEVEL_RADAR = {
  'Basic':        40,
  'Intermediate': 70,
  'Expert':       100,
};

export const LEVELS = ['Basic', 'Intermediate', 'Expert'];

export const JOB_ROLES = [
  'adobe xd',
  'agile',
  'airflow',
  'android',
  'ansible',
  'api testing',
  'arduino',
  'assembly',
  'automation testing',
  'aws',
  'azure',
  'backup recovery',
  'blender',
  'business intelligence',
  'c',
  'c++',
  'ci/cd',
  'cloud',
  'communication',
  'computer vision',
  'confluence',
  'core data',
  'cryptography',
  'cuda',
  'data analysis',
  'data pipelines',
  'data visualization',
  'database design',
  'dart',
  'deep learning',
  'defi',
  'design patterns',
  'design systems',
  'docker',
  'editing',
  'embedded c',
  'ethical hacking',
  'etl',
  'ethereum',
  'excel',
  'figma',
  'firebase',
  'firewalls',
  'flutter',
  'git',
  'google cloud',
  'hadoop',
  'hardhat',
  'hardware debugging',
  'html',
  'incident response',
  'iot',
  'ios',
  'java',
  'jenkins',
  'jira',
  'jupyter',
  'kafka',
  'kanban',
  'kotlin',
  'kubernetes',
  'leadership',
  'linux',
  'machine learning',
  'manual testing',
  'markdown',
  'market research',
  'microcontrollers',
  'microservices',
  'mlops',
  'model deployment',
  'mongodb',
  'monitoring',
  'mysql',
  'networking',
  'network security',
  'nft',
  'nlp',
  'node.js',
  'numpy',
  'object detection',
  'objective-c',
  'opencv',
  'opengl',
  'oracle',
  'pandas',
  'penetration testing',
  'performance tuning',
  'physics simulation',
  'postman',
  'postgresql',
  'power bi',
  'product roadmap',
  'prototyping',
  'pytorch',
  'python',
  'raspberry pi',
  'react',
  'react native',
  'redis',
  'reporting',
  'research',
  'responsive design',
  'rest api',
  'redux',
  'risk management',
  'routing',
  'rtos',
  'scikit-learn',
  'scrum',
  'security',
  'selenium',
  'siem',
  'sketch',
  'smart contracts',
  'solidity',
  'spark',
  'spacy',
  'spring boot',
  'sql',
  'sqlite',
  'stakeholder management',
  'statistics',
  'storage',
  'swift',
  'swiftui',
  'system design',
  'tableau',
  'tcp/ip',
  'team management',
  'tensorflow',
  'terraform',
  'text classification',
  'typography',
  'typescript',
  'ui/ux',
  'unity',
  'unreal engine',
  'user research',
  'vulnerability assessment',
  'web3.js',
  'webpack',
  'wireframing',
  'windows server',
  'xcode',
  'xml'
].sort((a, b) => a.localeCompare(b));

export const ROLE_SKILLS = {
  'Data Scientist':           ['python', 'machine learning', 'statistics', 'sql', 'pandas', 'data visualization', 'numpy', 'scikit-learn', 'jupyter', 'deep learning'],
  'AI Engineer':              ['python', 'deep learning', 'tensorflow', 'computer vision', 'pytorch', 'nlp', 'machine learning', 'cuda', 'model deployment', 'mlops'],
  'Full Stack Developer':     ['javascript', 'react', 'node.js', 'sql', 'rest api', 'html', 'css', 'mongodb', 'git', 'docker'],
  'Backend Developer':        ['java', 'spring boot', 'sql', 'microservices', 'rest api', 'docker', 'git', 'postgresql', 'redis', 'kafka'],
  'Frontend Developer':       ['javascript', 'react', 'html', 'css', 'typescript', 'git', 'responsive design', 'redux', 'webpack', 'figma'],
  'Mobile App Developer':     ['react native', 'flutter', 'dart', 'javascript', 'android', 'ios', 'firebase', 'rest api', 'git', 'ui/ux'],
  'Android Developer':        ['java', 'kotlin', 'android', 'xml', 'firebase', 'rest api', 'git', 'sqlite', 'mvvm', 'jetpack compose'],
  'iOS Developer':            ['swift', 'objective-c', 'ios', 'xcode', 'firebase', 'rest api', 'git', 'core data', 'swiftui', 'cocoapods'],
  'DevOps Engineer':          ['docker', 'kubernetes', 'jenkins', 'aws', 'linux', 'git', 'ci/cd', 'ansible', 'terraform', 'monitoring'],
  'Cloud Engineer':           ['aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform', 'linux', 'networking', 'security', 'ci/cd'],
  'Cybersecurity Engineer':   ['networking', 'linux', 'ethical hacking', 'penetration testing', 'firewalls', 'python', 'cryptography', 'siem', 'incident response', 'vulnerability assessment'],
  'Data Engineer':            ['python', 'sql', 'spark', 'hadoop', 'kafka', 'airflow', 'aws', 'data pipelines', 'etl', 'postgresql'],
  'Machine Learning Engineer':['python', 'machine learning', 'tensorflow', 'pytorch', 'mlops', 'docker', 'rest api', 'sql', 'scikit-learn', 'model deployment'],
  'Database Administrator':   ['sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'database design', 'backup recovery', 'performance tuning', 'linux', 'security'],
  'Software Architect':       ['system design', 'microservices', 'cloud', 'design patterns', 'rest api', 'docker', 'kubernetes', 'sql', 'agile', 'leadership'],
  'QA Engineer':              ['manual testing', 'automation testing', 'selenium', 'java', 'python', 'api testing', 'postman', 'jira', 'git', 'agile'],
  'UI/UX Designer':           ['figma', 'adobe xd', 'sketch', 'wireframing', 'prototyping', 'user research', 'html', 'css', 'typography', 'design systems'],
  'Blockchain Developer':     ['solidity', 'ethereum', 'web3.js', 'javascript', 'smart contracts', 'truffle', 'hardhat', 'defi', 'nft', 'cryptography'],
  'Embedded Systems Engineer':['c', 'c++', 'embedded c', 'microcontrollers', 'rtos', 'arduino', 'raspberry pi', 'assembly', 'iot', 'hardware debugging'],
  'Game Developer':           ['unity', 'c#', 'unreal engine', 'c++', '3d modeling', 'physics simulation', 'opengl', 'game design', 'blender', 'git'],
  'Site Reliability Engineer':['linux', 'python', 'kubernetes', 'docker', 'monitoring', 'alerting', 'ci/cd', 'aws', 'incident management', 'automation'],
  'Product Manager':          ['product roadmap', 'agile', 'user research', 'data analysis', 'jira', 'stakeholder management', 'wireframing', 'market research', 'sql', 'communication'],
  'Scrum Master':             ['agile', 'scrum', 'jira', 'team management', 'sprint planning', 'retrospectives', 'kanban', 'conflict resolution', 'communication', 'risk management'],
  'Data Analyst':             ['sql', 'python', 'excel', 'tableau', 'power bi', 'data visualization', 'statistics', 'pandas', 'reporting', 'business intelligence'],
  'NLP Engineer':             ['python', 'nlp', 'transformers', 'bert', 'spacy', 'nltk', 'deep learning', 'pytorch', 'tensorflow', 'text classification'],
  'Computer Vision Engineer': ['python', 'computer vision', 'opencv', 'deep learning', 'pytorch', 'tensorflow', 'image processing', 'cnn', 'object detection', 'cuda'],
  'Network Engineer':         ['networking', 'cisco', 'routing', 'switching', 'tcp/ip', 'firewalls', 'linux', 'vpn', 'network security', 'monitoring'],
  'Systems Engineer':         ['linux', 'windows server', 'networking', 'virtualization', 'docker', 'aws', 'bash scripting', 'monitoring', 'security', 'storage'],
  'Technical Writer':         ['documentation', 'markdown', 'api documentation', 'git', 'html', 'communication', 'research', 'editing', 'confluence', 'jira'],
  'AR/VR Developer':          ['unity', 'c#', 'unreal engine', 'openxr', '3d modeling', 'blender', 'c++', 'spatial computing', 'shader programming', 'git'],
};

export async function analyzeSkills(skillsWithLevels, role) {
  const userSkills = skillsWithLevels.map(s => s.name);

  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_skills: userSkills, role }),
  });

  if (!response.ok)
    throw new Error('Failed to connect to backend. Make sure Spring Boot is running on port 8080.');

  const text   = await response.text();
  const result = JSON.parse(text);

  if (result.error) return result;

  const totalSkills  = (result.matched_skills || []).length + (result.missing_skills || []).length;
  const matchedNames = new Set((result.matched_skills || []).map(s => s.toLowerCase()));

  const weightedPoints = skillsWithLevels.reduce((acc, s) => {
    if (matchedNames.has(s.name.toLowerCase())) {
      acc += LEVEL_WEIGHTS[s.level] || 1.0;
    }
    return acc;
  }, 0);

  const weighted_score = totalSkills > 0
    ? Math.round((weightedPoints / totalSkills) * 100 * 10) / 10
    : 0;

  return {
    ...result,
    role,
    match_score:        weighted_score,
    raw_score:          result.match_score,
    skills_with_levels: skillsWithLevels,
  };
}