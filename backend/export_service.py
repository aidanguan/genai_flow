"""
导出服务 - 支持 SVG, PNG, PDF 格式导出
"""
import base64
from io import BytesIO
from typing import Optional
from fastapi import HTTPException
from fastapi.responses import StreamingResponse


class ExportService:
    """导出服务"""
    
    async def export_svg(self, svg_content: str, filename: str = "diagram.svg") -> StreamingResponse:
        """导出 SVG"""
        svg_bytes = svg_content.encode('utf-8')
        
        return StreamingResponse(
            BytesIO(svg_bytes),
            media_type="image/svg+xml",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    async def export_png(
        self,
        svg_content: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        filename: str = "diagram.png"
    ) -> StreamingResponse:
        """导出 PNG
        
        注意: 由于依赖较重的图像库,这里返回 SVG 供前端转换
        生产环境建议使用 cairosvg 或 selenium + Chrome headless
        """
        # 简化实现: 返回 SVG,由前端 Canvas 转换
        return await self.export_svg(svg_content, filename.replace('.png', '.svg'))
    
    async def export_pdf(
        self,
        svg_content: str,
        filename: str = "diagram.pdf"
    ) -> StreamingResponse:
        """导出 PDF
        
        注意: 需要安装 weasyprint 或 reportlab
        这里提供简化实现
        """
        # 简化实现: 返回 SVG,建议前端使用 jsPDF 转换
        # 或后端使用 weasyprint: from weasyprint import HTML
        return await self.export_svg(svg_content, filename.replace('.pdf', '.svg'))


# 全局导出服务实例
export_service = ExportService()
