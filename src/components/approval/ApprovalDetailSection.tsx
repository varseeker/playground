import React, { memo, useMemo } from 'react';
import { Card, Col, Divider, Empty, Row, Skeleton, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ComparisonTableApproval from './ComparisonTableApproval';

const { Text } = Typography;

type PrimitiveValue = string | number | boolean;
type GenericObject = Record<string, unknown>;
type StringKeyOf<T> = Extract<keyof T, string>;

export interface ApprovalDetailSectionProps<T extends GenericObject> {
  data: T;
  loading?: boolean;
}

interface PrimitiveField {
  key: string;
  label: string;
  value: PrimitiveValue;
}

interface TableSection {
  sectionType: 'table';
  key: string;
  title: string;
  rows: GenericObject[];
  columns: ColumnsType<GenericObject>;
}

interface ComparisonSection {
  sectionType: 'comparison';
  key: string;
  title: string;
  oldKey: string;
  newKey: string;
  dataOld: GenericObject[];
  dataNew: GenericObject[];
}

type ListSection = TableSection | ComparisonSection;

interface ParsedSections {
  primitiveFields: PrimitiveField[];
  listSections: ListSection[];
}

const EMPTY_VALUE_PLACEHOLDER = '-';
const sectionContainerStyle: React.CSSProperties = {
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  padding: 12,
  height: '100%',
};
const sectionTitleStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 12,
};

export function isPrimitive(value: unknown): value is PrimitiveValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function isArrayOfObject(value: unknown): value is GenericObject[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item));
}

export function formatLabel(key: string): string {
  const normalized = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ');

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderUnknownValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE_PLACEHOLDER;
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  return JSON.stringify(value);
}

function renderPrimitiveValue(value: PrimitiveValue): React.ReactNode {
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (value === '') {
    return EMPTY_VALUE_PLACEHOLDER;
  }

  return String(value);
}

export function generateColumns<T extends GenericObject>(data: T[]): ColumnsType<T> {
  const firstRow = data[0];

  if (!firstRow) {
    return [];
  }

  const keys = Object.keys(firstRow) as Array<StringKeyOf<T>>;

  return keys.map((key): ColumnsType<T>[number] => ({
    title: formatLabel(key),
    dataIndex: key,
    key,
    render: (value: unknown) => renderUnknownValue(value),
  }));
}

function hasSuffix(value: string, suffix: 'Old' | 'New'): boolean {
  return value.endsWith(suffix) && value.length > suffix.length;
}

function removeSuffix(value: string, suffix: 'Old' | 'New'): string {
  return value.slice(0, value.length - suffix.length);
}

function buildSections(data: GenericObject): ParsedSections {
  const primitiveFields: PrimitiveField[] = [];
  const tableCandidates: Array<{ key: string; rows: GenericObject[] }> = [];

  (Object.entries(data) as Array<[string, unknown]>).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (isPrimitive(value)) {
      primitiveFields.push({
        key,
        label: formatLabel(key),
        value,
      });
      return;
    }

    if (isArrayOfObject(value)) {
      tableCandidates.push({ key, rows: value });
    }
  });

  const tableMap = new Map<string, GenericObject[]>(
    tableCandidates.map((item) => [item.key, item.rows] as const),
  );
  const visitedKeys = new Set<string>();
  const listSections: ListSection[] = [];

  tableCandidates.forEach(({ key, rows }) => {
    if (visitedKeys.has(key)) {
      return;
    }

    if (hasSuffix(key, 'Old')) {
      const baseKey = removeSuffix(key, 'Old');
      const newKey = `${baseKey}New`;
      const newRows = tableMap.get(newKey);
      const comparisonBase = baseKey || key;

      if (newRows) {
        visitedKeys.add(key);
        visitedKeys.add(newKey);
        listSections.push({
          sectionType: 'comparison',
          key: `comparison-${comparisonBase}`,
          title: formatLabel(comparisonBase),
          oldKey: key,
          newKey,
          dataOld: rows,
          dataNew: newRows,
        });
        return;
      }
    }

    if (hasSuffix(key, 'New')) {
      const baseKey = removeSuffix(key, 'New');
      const oldKey = `${baseKey}Old`;
      const oldRows = tableMap.get(oldKey);
      const comparisonBase = baseKey || key;

      if (oldRows) {
        visitedKeys.add(key);
        visitedKeys.add(oldKey);
        listSections.push({
          sectionType: 'comparison',
          key: `comparison-${comparisonBase}`,
          title: formatLabel(comparisonBase),
          oldKey,
          newKey: key,
          dataOld: oldRows,
          dataNew: rows,
        });
        return;
      }
    }

    visitedKeys.add(key);
    listSections.push({
      sectionType: 'table',
      key: `table-${key}`,
      title: formatLabel(key),
      rows,
      columns: generateColumns(rows),
    });
  });

  return {
    primitiveFields,
    listSections,
  };
}

function ApprovalDetailSectionComponent<T extends GenericObject>({
  data,
  loading = false,
}: ApprovalDetailSectionProps<T>): JSX.Element {
  const { primitiveFields, listSections } = useMemo(() => buildSections(data), [data]);
  const hasContent = primitiveFields.length > 0 || listSections.length > 0;

  if (loading && !hasContent) {
    return (
      <Card size="small">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card size="small">
        <Empty description="No approval detail data available" />
      </Card>
    );
  }

  return (
    <Card size="small" styles={{ body: { padding: 16 } }}>
      {primitiveFields.length > 0 && (
        <Row gutter={[16, 12]}>
          {primitiveFields.map((field) => (
            <Col key={field.key} xs={24} md={12}>
              <Text strong>{field.label}</Text>
              <Text>{`: ${renderPrimitiveValue(field.value)}`}</Text>
            </Col>
          ))}
        </Row>
      )}

      {primitiveFields.length > 0 && listSections.length > 0 && <Divider style={{ margin: '16px 0' }} />}

      {listSections.length > 0 && (
        <Row gutter={[16, 16]}>
          {listSections.map((section) => (
            <Col key={section.key} xs={24} md={12}>
              <div style={sectionContainerStyle}>
                <Text strong style={sectionTitleStyle}>
                  {section.title}
                </Text>

                {section.sectionType === 'comparison' ? (
                  <ComparisonTableApproval
                    props={{
                      dataOld: section.dataOld,
                      dataNew: section.dataNew,
                      oldKey: section.oldKey,
                      newKey: section.newKey,
                      height: 360,
                    }}
                  />
                ) : (
                  <Table<GenericObject>
                    size="small"
                    loading={loading}
                    columns={section.columns}
                    dataSource={section.rows}
                    pagination={false}
                    rowKey={(_, rowIndex) => `${section.key}-${rowIndex ?? 0}`}
                    scroll={{ x: 'max-content' }}
                    locale={{
                      emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />,
                    }}
                  />
                )}
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}

export const ApprovalDetailSection = memo(ApprovalDetailSectionComponent) as typeof ApprovalDetailSectionComponent;

export default ApprovalDetailSection;
