/**
 *
 *
 * @module Skeleton
 *
 * Created by Evgeniy Malyarov on 02.05.2020.
 */

class Skeleton extends Graph {

  /**
   * Ищет узел по координатам точки
   * @param point
   * @param vertices
   * @return {GraphVertex}
   */
  vertexByPoint(point, vertices) {
    return (vertices || this.getAllVertices())
      .find((vertex) => vertex.point.is_nearest(point, 0));
  }

  /**
   * Возвращает массив узлов, связанных с текущим профилем
   * @param profile
   * @return {GraphVertex[]}
   */
  vertexesByProfile(profile) {
    const res = new Set();
    this.getAllEdges().forEach((edge) => {
      if(edge.profile === profile) {
        res.add(edge.startVertex);
        res.add(edge.endVertex);
      }
    });
    return Array.from(res);
  }

  /**
   * Возвращает группы узлов слева и справа от текущей точки
   * @param profile
   * @param point
   * @return {{left: [], right: []}}
   */
  splitVertexes(profile, point) {
    const {generatrix} = profile;
    const res = {
      left: [],
      right: [],
      offset: generatrix.getOffsetOf(generatrix.getNearestPoint(point)),
    };
    for(const vertex of this.vertexesByProfile(profile)) {
      const offset = generatrix.getOffsetOf(generatrix.getNearestPoint(vertex.point));
      if(offset < res.offset) {
        res.left.push({vertex, offset});
      }
      else {
        res.right.push({vertex, offset});
      }
    }
    return res;
  }

  /**
   * Создаёт при необходимости узел в точке
   * @param point
   * @return {GraphVertex}
   */
  createVertexByPoint(point) {
    const vertices = this.getAllVertices();
    let vertex = this.vertexByPoint(point, vertices);
    if(!vertex) {
      vertex = new GraphVertex(vertices.length + 1, point);
      this.addVertex(vertex);
    }
    return vertex;
  }

  /**
   * Делит элемент, к которому примыкает импост на два ребра
   * @param cnn
   * @param vertex
   */
  addImpostEdges(cnn, vertex) {
    if(cnn.profile && !cnn.profile_point) {
      // находим точки на ведущем профиле
      const {left, right, offset} = this.splitVertexes(cnn.profile, vertex.point);
      if(left.length == 1 && right.length == 1) {
        // Если сторона соединения изнутри, делим в прямом направлении
        if(cnn.profile.cnn_side(cnn.parent, cnn.parent.generatrix.interiorPoint) === $p.enm.cnn_sides.Изнутри) {
          const edge = this.findEdge(left[0].vertex, right[0].vertex);
          if(edge) {
            this.deleteEdge(edge);
          }
          this.addEdge(new GraphEdge({startVertex: left[0].vertex, endVertex: vertex, profile: cnn.profile}));
          this.addEdge(new GraphEdge({startVertex: vertex, endVertex: right[0].vertex, profile: cnn.profile}));
        }
        else {
          const edge = this.findEdge(right[0].vertex, left[0].vertex);
          if(edge) {
            this.deleteEdge(edge);
          }
          this.addEdge(new GraphEdge({startVertex: right[0].vertex, endVertex: vertex, profile: cnn.profile}));
          this.addEdge(new GraphEdge({startVertex: vertex, endVertex: left[0].vertex, profile: cnn.profile}));
        }
      }
      else {
        //throw new Error('Пересечение узлов');
      }
    }
  }

  /**
   * Добавляет профиль в граф
   * @param profile
   */
  addProfile(profile) {
    const b = this.createVertexByPoint(profile.b);
    const e = this.createVertexByPoint(profile.e);
    if(this.findEdge(b, e)) {
      throw new Error('Edge has already been added before');
    }
    this.addEdge(new GraphEdge({startVertex: b, endVertex: e, profile}));

    // если импост, добавляем ребро в обратную сторону
    const {ab, ae} = profile.is_corner();
    const {_rays} = profile._attr;
    if(ab && ae) {
      return;
    }

    // рвём элемент, к которому примыкает импост
    let add;
    if(_rays.b.profile && !_rays.b.profile.e.is_nearest(profile.b) && !_rays.b.profile.b.is_nearest(profile.b)) {
      this.addImpostEdges(_rays.b, b);
      add = true;
    }
    if(_rays.e.profile && !_rays.e.profile.b.is_nearest(profile.e) && !_rays.e.profile.e.is_nearest(profile.e)) {
      this.addImpostEdges(_rays.e, e);
      add = true;
    }
    if(add) {
      this.addEdge(new GraphEdge({startVertex: e, endVertex: b, profile}));
    }

  }

  /**
   * Удаляет профиль из графа
   * @param profile
   */
  removeProfile(profile) {

  }
}