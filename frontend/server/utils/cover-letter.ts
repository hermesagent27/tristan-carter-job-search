// Generate a personalized cover letter for a job
export async function generateCoverLetter(job: any): Promise<string> {
  const { title, company, description, tags } = job
  
  // Extract relevant info from description
  const descSnippet = description?.slice(0, 500) || ''
  
  // Build skill highlights based on tags
  const skillMap: Record<string, string> = {
    'vue': 'Vue.js and Nuxt',
    'nuxt': 'Nuxt 4',
    'react': 'React',
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'frontend': 'frontend development',
    'fullstack': 'full-stack development',
    'tailwind': 'Tailwind CSS',
    'support': 'technical support',
  }
  
  const relevantSkills = tags
    .map((t: string) => skillMap[t.toLowerCase()])
    .filter(Boolean)
    .slice(0, 3)
  
  const skillsText = relevantSkills.length > 0 
    ? relevantSkills.join(', ')
    : 'web development'
  
  // Generate cover letter
  return `Dear ${company} Hiring Manager,

I am writing to express my interest in the ${title} position at ${company}. With hands-on experience in ${skillsText}, I am excited about the opportunity to contribute to your team.

${descSnippet.includes('remote') || job.is_remote ? 'I am particularly drawn to this role because of the remote flexibility, which allows me to bring my best work while maintaining a healthy work-life balance. ' : ''}My background in management has taught me the value of clear communication and taking initiative—qualities I bring to every project I work on.

What excites me about this position is ${descSnippet.slice(0, 200).toLowerCase().includes('build') || descSnippet.slice(0, 200).toLowerCase().includes('create') ? 'the opportunity to build and create solutions that make a real impact. ' : 'the chance to grow my technical skills while contributing to meaningful work. '}I am a quick learner who thrives in environments where I can take ownership and solve problems independently.

I would welcome the chance to discuss how my skills and experience align with your needs. Thank you for considering my application.

Sincerely,
Tristan Carter`
}
