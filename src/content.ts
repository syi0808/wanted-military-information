const getSearchedURL = (companyName: string): string => {
  return `http://localhost:814/${companyName}`;
};

const companiesMap = new Map<string, HTMLElement[]>();

const createCompanyTooltip = (searchedCompanies: HTMLElement[]): HTMLDivElement => {
  const tooltipDom = document.createElement('div');

  tooltipDom.addEventListener('click', (e) => e.stopPropagation());

  tooltipDom.innerHTML = `
    <div class="military-tooltip"> 
    </div>
  `;

  searchedCompanies.forEach((searchedCompany) => {
    const clonedDom = searchedCompany.childNodes?.[0]?.cloneNode(true) as HTMLElement;

    clonedDom.setAttribute('href', `https://work.mma.go.kr${clonedDom.getAttribute('href')}`);
    clonedDom.setAttribute('target', '_blank');

    tooltipDom.getElementsByClassName('military-tooltip')[0].appendChild(clonedDom);
  });

  return tooltipDom;
};

const parseComapnyNames = (rawCompanyName: string): string[] => {
  return [rawCompanyName];
};

const getSearchedCompany = async (companyName: string): Promise<HTMLElement[]> => {
  if (companiesMap.has(companyName)) return companiesMap.get(companyName)!;

  const response = await (await fetch(getSearchedURL(companyName))).text();

  const searchResultDom = new DOMParser().parseFromString(response, 'text/html');

  const searchedCompanies = [...searchResultDom.body.querySelectorAll('th.title')] as HTMLElement[];

  companiesMap.set(companyName, searchedCompanies);

  return searchedCompanies;
};

const observer = new MutationObserver(() => {
  const jobCardElements = document.querySelectorAll('[data-cy="job-card"]');

  [...jobCardElements].forEach(async (jobCardNode, index) => {
    const companyNameNode = jobCardNode.getElementsByClassName('job-card-company-name')[0] as HTMLElement;
    const companyNames = parseComapnyNames(companyNameNode.innerText);

    companyNameNode.classList.add('military-tooltip-wrapper');

    companyNameNode.style.position = 'relative';
    companyNameNode.style.overflow = 'visible';

    const searchedCompanies = (
      await Promise.all(companyNames.map((companyName) => getSearchedCompany(companyName)))
    ).flat();

    const companiesTooltip = createCompanyTooltip(searchedCompanies);

    companyNameNode.appendChild(companiesTooltip);
  });
});

const jobList = document.querySelector('[data-cy="job-list"]');

if (jobList) {
  observer.observe(jobList, { childList: true });

  const styleNode = document.createElement('style');

  styleNode.innerHTML = `
    .military-tooltip {
      position: absolute;
      left: 0;
      bottom: 101%;
      display: none;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      border: 1px solid #ddd;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      background: white;
    }

    .military-tooltip-wrapper:hover .military-tooltip {
      display: flex;
    }
  `;

  document.head.appendChild(styleNode);
}