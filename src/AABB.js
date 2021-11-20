export default class AABB {

    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;

    add(x, y)
    {
        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x);
        this.maxY = Math.max(this.maxY, y);
    }

    get width()
    {
        return (this.maxX - this.minX) | 0;
    }


    get height()
    {
        return (this.maxY - this.minY) | 0;
    }
}
