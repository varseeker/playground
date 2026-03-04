import React, { useMemo } from 'react';
import { ApprovalDetailSection } from './ApprovalDetailSection';

type ApprovalApiResponse = Record<string, unknown>;

const approvalResponseExampleOne: ApprovalApiResponse = {
  productCode: '',
  productName: '',
  listTieringIBMBSubsFeeOld: [],
  listTieringIBMBSubsFeeNew: [],
  listTieringIBMBRedempFeeOld: [],
  listTieringIBMBRedempFeeNew: [],
};

const approvalResponseExampleTwo: ApprovalApiResponse = {
  lateralName: '',
  NavTransactionNew: [],
  NavTransactionOld: [],
};

export default function ApprovalDetailSectionExample(): React.JSX.Element {
  const data = useMemo<ApprovalApiResponse>(() => {
    const selectedExample: 'exampleOne' | 'exampleTwo' = 'exampleOne';
    return selectedExample === 'exampleOne' ? approvalResponseExampleOne : approvalResponseExampleTwo;
  }, []);

  return <ApprovalDetailSection data={data} loading={false} />;
}
