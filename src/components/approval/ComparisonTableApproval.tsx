import React, { useMemo } from 'react';
import type { ColumnsType } from 'antd/es/table';
import ComparisonDoubleTable from 'components/reusable/comparison-table/ComparisonDoubleTable';

type GenericObject = Record<string, unknown>;

interface ComparisonTableApprovalInput<T extends GenericObject> {
  dataOld: T[];
  dataNew: T[];
  oldKey: string;
  newKey: string;
  height?: number;
}

export interface ComparisonTableApprovalProps<T extends GenericObject> {
  props: ComparisonTableApprovalInput<T>;
}

function formatLabel(key: string): string {
  const normalized = key
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ');

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function generateColumns<T extends GenericObject>(rows: T[]): ColumnsType<T> {
  const firstRow = rows[0];

  if (!firstRow) {
    return [];
  }

  return (Object.keys(firstRow) as Array<Extract<keyof T, string>>).map((key) => ({
    title: formatLabel(key),
    dataIndex: key,
    key,
  }));
}

function ComparisonTableApproval<T extends GenericObject>({
  props,
}: ComparisonTableApprovalProps<T>): JSX.Element {
  const {
    dataOld = [],
    dataNew = [],
    oldKey,
    newKey,
    height = 360,
  } = props;

  const columns = useMemo<ColumnsType<T>>(() => {
    const candidateRows = dataNew.length > 0 ? dataNew : dataOld;
    return generateColumns(candidateRows);
  }, [dataOld, dataNew]);

  return (
    <ComparisonDoubleTable
      columns={columns}
      leftDataSource={dataOld}
      rightDataSource={dataNew}
      leftTitle={formatLabel(oldKey)}
      rightTitle={formatLabel(newKey)}
      height={height}
    />
  );
}

export default ComparisonTableApproval;
