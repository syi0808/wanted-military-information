const getSearchedURL = (companyName: string): string => {
  return `http://localhost:814/${companyName}`;
};

const companiesMap = new Map<string, HTMLElement[]>();

const createCompanyTooltip = (searchedCompanies: HTMLElement[]): HTMLDivElement | null => {
  if (!searchedCompanies.length) return null;

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
  if (rawCompanyName.includes('(') && rawCompanyName.includes(')')) {
    return [rawCompanyName.split('(')[0], rawCompanyName.split('(')[1].slice(0, -1)];
  }

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

  [...jobCardElements].forEach(async (jobCardNode) => {
    const companyNameNode = [...jobCardNode.getElementsByTagName('span')].at(-1) as HTMLElement;
    const companyNames = parseComapnyNames(companyNameNode.innerText);

    if (companyNameNode.getElementsByClassName('military-tooltip').length) return;

    companyNameNode.classList.add('military-tooltip-wrapper');

    companyNameNode.style.position = 'relative';
    companyNameNode.style.overflow = 'visible';

    const searchedCompanies = (
      await Promise.all(companyNames.map((companyName) => getSearchedCompany(companyName)))
    ).flat();

    const companiesTooltip = createCompanyTooltip(searchedCompanies);

    if (companiesTooltip) {
      companyNameNode.appendChild(companiesTooltip);
    }
  });
});

let jobList: Element;

const bodyObserver = new MutationObserver(() => {
  const newJobList = document.querySelector('[data-cy="job-list"]');

  if (newJobList && newJobList !== jobList) {
    observer.disconnect();
    observer.observe(newJobList, { childList: true });
    jobList = newJobList;
  }
});

bodyObserver.observe(document.body, { subtree: true, childList: true });

const styleNode = document.createElement('style');

styleNode.innerHTML = `
  .military-tooltip {
    position: absolute;
    left: 0;
    bottom: 101%;
    display: flex;
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
