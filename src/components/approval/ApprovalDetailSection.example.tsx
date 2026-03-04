import React, { useMemo } from 'react';
import { ApprovalDetailSection } from './ApprovalDetailSection';

type ApprovalApiResponse = Record<string, unknown>;

const approvalResponseExampleOne: ApprovalApiResponse = {
  confTranIbMbId: 0,
  actionType: 'Update',
  productId: 1,
  productCode: 'PRD001',
  productName: 'Manulife Equity',
  productCcy: 'IDR',
  listDataNew: {
    minSubsNew: 1000000,
    minSubsAdd: 1000000,
    minRedemption: 1000000,
    pctFeeSubs: 3.2,
    pctFeeRedemp: 2.2,
    isAlreadyEffective: 'No',
    effectiveDate: '2000-01-01T00:00:00',
    listTieringIBMBSubsFee: [
      {
        status: 'Karyawan',
        volumeMin: 1,
        volumeMax: 999999999999,
        percentage: 0.25,
      },
    ],
    listTieringIBMBRedempFee: [
      {
        status: 'Karyawan',
        period: 0,
        volumeMin: 1,
        volumeMax: 999999999999,
        percentage: 0.25,
      },
    ],
  },
  listDataOld: {
    minSubsNew: 900000,
    minSubsAdd: 800000,
    minRedemption: 900000,
    pctFeeSubs: 3.5,
    pctFeeRedemp: 2.5,
    isAlreadyEffective: 'No',
    effectiveDate: '2000-01-01T00:00:00',
    listTieringIBMBSubsFee: [
      {
        status: 'Karyawan',
        volumeMin: 1,
        volumeMax: 999999999999,
        percentage: 0.3,
      },
    ],
    listTieringIBMBRedempFee: [
      {
        status: 'Karyawan',
        period: 0,
        volumeMin: 1,
        volumeMax: 999999999999,
        percentage: 0.3,
      },
    ],
  },
};

const approvalResponseExampleTwo: ApprovalApiResponse = {
  actionType: 1,
  actionTypeDesc: 'NEW INPUT',
  productId: 2,
  productCode: 'PRD002',
  productName: 'MNC Dana Likuid',
  productCcy: 'IDR',
  userInput: 10001,
  dateInput: '2000-01-01T00:00:00',
  listDataNew: {
    minSubcNewEmp: 1000000,
    minSubcAddEmp: 1000000,
    minRedempByUnit: 0,
    minRedemptionEmp: 1000000,
    minBalanceEmp: 1000000,
    roundTypeUnit: 0,
    roundUnit: 0,
    partialMature: [
      {
        danaMature: 50.7,
        tanggalMature: '2000-01-01T00:00:00',
      },
    ],
    windowPeriod: 0,
    rangePeriod: 0,
    persenAUM: 50.7,
  },
  listDataOld: {
    minSubcNewEmp: 900000,
    minSubcAddEmp: 900000,
    minRedempByUnit: 0,
    minRedemptionEmp: 900000,
    minBalanceEmp: 900000,
    roundTypeUnit: 0,
    roundUnit: 0,
    partialMature: [
      {
        danaMature: 40.5,
        tanggalMature: '2000-01-01T00:00:00',
      },
    ],
    windowPeriod: 0,
    rangePeriod: 0,
    persenAUM: 40.5,
  },
};

export default function ApprovalDetailSectionExample(): React.JSX.Element {
  const data = useMemo<ApprovalApiResponse>(() => {
    const selectedExample: 'exampleOne' | 'exampleTwo' = 'exampleOne';
    return selectedExample === 'exampleOne' ? approvalResponseExampleOne : approvalResponseExampleTwo;
  }, []);

  return <ApprovalDetailSection data={data} loading={false} />;
}
