import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { FileUploadZone } from '../../../src/features/knowledge-base/components/FileUploadZone';

describe('FileUploadZone Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const onUpload = vi.fn();
        const { baseElement } = render(
            <MemoryRouter><main><FileUploadZone onUpload={onUpload} isUploading={false} /></main></MemoryRouter>
        );
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
