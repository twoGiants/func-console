import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { FunctionsEmptyState } from '../components/EmptyState';
import { FunctionTable } from '../components/FunctionTable';
import { useFunctionsList } from '../hooks/useFunctionsList';

export default function FunctionsListPage() {
  const { t } = useTranslation('plugin__console-functions-plugin');
  const { functions, loaded } = useFunctionsList();

  return (
    <>
      <DocumentTitle>{t('functions')}</DocumentTitle>
      <ListPageHeader title={t('functions')} />
      <PageSection>
        {loaded && functions.length === 0 && <FunctionsEmptyState />}
        {loaded && functions.length > 0 && <FunctionTable functions={functions} />}
      </PageSection>
    </>
  );
}
