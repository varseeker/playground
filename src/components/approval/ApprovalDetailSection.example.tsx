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
  lateralName: 'Retail Growth',
  productCode: 'PRD001',
  statusActive: true,
  NavTransactionOld: [
    {
      minimumAmount: 100000,
      fee: 1.5,
    },
  ],
  NavTransactionNew: [
    {
      minimumAmount: 150000,
      fee: 1.2,
    },
  ],
};

export default function ApprovalDetailSectionExample(): React.JSX.Element {
  const data = useMemo<ApprovalApiResponse>(() => {
    const selectedExample: 'exampleOne' | 'exampleTwo' = 'exampleTwo';
    return selectedExample === 'exampleOne' ? approvalResponseExampleOne : approvalResponseExampleTwo;
  }, []);

  return <ApprovalDetailSection data={data} loading={false} />;
}
