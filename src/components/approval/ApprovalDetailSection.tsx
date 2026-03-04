import React, { memo, useMemo } from 'react';
import { Card, Col, Divider, Empty, Row, Skeleton, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

type PrimitiveValue = string | number | boolean;
type GenericObject = Record<string, unknown>;
type StringKeyOf<T> = Extract<keyof T, string>;

export interface ApprovalDetailSectionProps<T extends GenericObject> {
  data: T;
  loading?: boolean;
}

interface PrimitiveSection {
  sectionType: 'primitive';
  key: string;
  title: string;
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

type Section = PrimitiveSection | TableSection;

const EMPTY_VALUE_PLACEHOLDER = '-';

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

function buildSections(data: GenericObject): Section[] {
  const sections: Section[] = [];

  (Object.entries(data) as Array<[string, unknown]>).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const sectionTitle = formatLabel(key);

    if (isPrimitive(value)) {
      sections.push({
        sectionType: 'primitive',
        key,
        title: sectionTitle,
        label: sectionTitle,
        value,
      });
      return;
    }

    if (isArrayOfObject(value)) {
      const rows = value;
      sections.push({
        sectionType: 'table',
        key,
        title: sectionTitle,
        rows,
        columns: generateColumns(rows),
      });
    }
  });

  return sections;
}

function ApprovalDetailSectionComponent<T extends GenericObject>({
  data,
  loading = false,
}: ApprovalDetailSectionProps<T>): JSX.Element {
  const sections = useMemo(() => buildSections(data), [data]);

  if (loading && sections.length === 0) {
    return (
      <Card size="small">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (sections.length === 0) {
    return (
      <Card size="small">
        <Empty description="No approval detail data available" />
      </Card>
    );
  }

  return (
    <div>
      {sections.map((section, index) => (
        <React.Fragment key={section.key}>
          {section.sectionType === 'primitive' ? (
            <Card size="small" title={section.title} loading={loading}>
              <Row gutter={[16, 12]} align="middle">
                <Col xs={24} md={12}>
                  <Text strong>{section.label}</Text>
                </Col>
                <Col xs={24} md={12}>
                  <Text>{renderPrimitiveValue(section.value)}</Text>
                </Col>
              </Row>
            </Card>
          ) : (
            <Card size="small" title={section.title}>
              <Table<GenericObject>
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
            </Card>
          )}

          {index < sections.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </div>
  );
}

export const ApprovalDetailSection = memo(ApprovalDetailSectionComponent) as typeof ApprovalDetailSectionComponent;

export default ApprovalDetailSection;
